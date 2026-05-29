/**
 * publicController.js
 * ────────────────────
 * Server-to-server controller: exposes PrepAI content that the Next.js
 * SSR layer must fetch WITHOUT a user JWT token.
 *
 * WHY THIS FILE EXISTS
 * ─────────────────────
 * The Next.js `generateMetadata()` function runs on the server at
 * request time. It has no user session, so it cannot attach a JWT.
 * These routes bypass `auth` middleware but are:
 *   1. Read-only (GET only, no mutations).
 *   2. Rate-limited in the Express router.
 *   3. Scoped to fields that would appear on a public landing page.
 *
 * DATA EXPOSURE POLICY
 * ─────────────────────
 * ✅ Question title, description, difficulty, skills, company slugs, type
 * ✅ Test case inputs/outputs (public sample data only)
 * ✅ Company name, slug, description, difficulty, hiringPattern
 * ✅ Interview experience company, role, difficulty, result, round names
 * ❌ User IDs, emails, JWTs, upvote arrays, admin fields
 * ❌ Answer keys / isCorrect MCQ options
 */

import Question          from '../models/Question.js';
import Company           from '../models/Company.js';
import InterviewExperience from '../models/InterviewExperience.js';

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS — Public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/public/questions
 * Returns a paginated list of questions for sitemap generation.
 * Fields: _id, title, difficulty, skills, company, type, createdAt
 */
export const getPublicQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 100, difficulty, skills, company } = req.query;
    const query = {};

    if (difficulty) query.difficulty = difficulty;
    if (company)    query.company    = company;
    if (skills)     query.skills     = { $in: skills.split(',').map(s => s.trim()) };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Question.countDocuments(query);

    // Strip isCorrect from MCQ options — never expose answer keys publicly
    const questions = await Question.find(query, {
      title:      1,
      description: 1,
      difficulty: 1,
      skills:     1,
      company:    1,
      type:       1,
      testCases:  1,
      createdAt:  1,
      // Explicitly exclude the isCorrect field inside options
      'options.isCorrect': 0,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      questions,
      pagination: {
        page:       parseInt(page),
        limit:      parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/public/questions/:id
 * Returns a single question by MongoDB ObjectId.
 * Used by Next.js `generateMetadata()` and the problem page server component.
 */
export const getPublicQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id, {
      title:       1,
      description: 1,
      difficulty:  1,
      skills:      1,
      company:     1,
      type:        1,
      testCases:   1,
      createdAt:   1,
      // Exclude isCorrect from every option sub-document
      'options.text':      1,
      'options.isCorrect': 0,
    }).lean();

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(question);
  } catch (err) {
    // Invalid ObjectId format
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/public/questions/slugs
 * Returns only _id + title for every question — used by sitemap generator.
 * Extremely lightweight: no descriptions, no options, no test cases.
 */
export const getQuestionSlugs = async (req, res) => {
  try {
    const slugs = await Question.find({}, { _id: 1, title: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();

    res.json(slugs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPANIES — Public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/public/companies
 * Returns all companies with question counts. No auth required.
 * This is the same logic as getAllCompanies but without the auth guard.
 */
export const getPublicCompanies = async (req, res) => {
  try {
    const companies = await Company.find({}, {
      name:           1,
      slug:           1,
      description:    1,
      difficulty:     1,
      hiringPattern:  1,
      logo:           1,
      color:          1,
      createdAt:      1,
    })
      .sort({ name: 1 })
      .lean();

    const enriched = await Promise.all(
      companies.map(async (company) => {
        const questionCount  = await Question.countDocuments({ company: company.slug });
        const easyCount      = await Question.countDocuments({ company: company.slug, difficulty: 'easy' });
        const mediumCount    = await Question.countDocuments({ company: company.slug, difficulty: 'medium' });
        const hardCount      = await Question.countDocuments({ company: company.slug, difficulty: 'hard' });
        return {
          ...company,
          questionCount,
          questionsByDifficulty: { easy: easyCount, medium: mediumCount, hard: hardCount },
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/public/companies/:slug
 * Single company by slug — used by generateMetadata on the company page.
 */
export const getPublicCompanyBySlug = async (req, res) => {
  try {
    const company = await Company.findOne(
      { slug: req.params.slug },
      { name: 1, slug: 1, description: 1, difficulty: 1, hiringPattern: 1,
        logo: 1, color: 1, createdAt: 1 }
    ).lean();

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const questionCount = await Question.countDocuments({ company: company.slug });
    const easyCount     = await Question.countDocuments({ company: company.slug, difficulty: 'easy' });
    const mediumCount   = await Question.countDocuments({ company: company.slug, difficulty: 'medium' });
    const hardCount     = await Question.countDocuments({ company: company.slug, difficulty: 'hard' });

    res.json({
      ...company,
      questionCount,
      questionsByDifficulty: { easy: easyCount, medium: mediumCount, hard: hardCount },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW EXPERIENCES — Public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/public/experiences
 * Paginated list of experiences for sitemap. Returns only IDs and timestamps.
 */
export const getPublicExperiences = async (req, res) => {
  try {
    const { page = 1, limit = 100, company } = req.query;
    const query = {};
    if (company) query.company = { $regex: company, $options: 'i' };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await InterviewExperience.countDocuments(query);

    const experiences = await InterviewExperience.find(query, {
      company:    1,
      role:       1,
      difficulty: 1,
      result:     1,
      createdAt:  1,
      // Expose round names/descriptions but NOT upvote arrays (user IDs)
      'rounds.name':        1,
      'rounds.description': 1,
    })
      .populate('author', 'name') // Only expose the display name, not user ID
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({ experiences, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/public/experiences/:id
 * Single experience for the public experience detail page.
 */
export const getPublicExperienceById = async (req, res) => {
  try {
    const experience = await InterviewExperience.findById(req.params.id, {
      company:      1,
      role:         1,
      difficulty:   1,
      result:       1,
      rounds:       1,
      overallTips:  1,
      createdAt:    1,
      // Exclude upvote array (contains user ObjectIds)
      upvotes:      0,
    })
      .populate('author', 'name')
      .lean();

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    res.json(experience);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Experience not found' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/public/experiences/ids
 * Returns only _id + createdAt for all experiences — for sitemap generation.
 */
export const getExperienceIds = async (req, res) => {
  try {
    const ids = await InterviewExperience.find(
      {},
      { _id: 1, createdAt: 1 }
    ).sort({ createdAt: -1 }).lean();

    res.json(ids);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
