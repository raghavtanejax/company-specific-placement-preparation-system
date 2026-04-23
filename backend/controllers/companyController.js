import Company from '../models/Company.js';
import Question from '../models/Question.js';

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });

    // Get question counts per company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const questionCount = await Question.countDocuments({ company: company.slug });
        const easyCount = await Question.countDocuments({ company: company.slug, difficulty: 'easy' });
        const mediumCount = await Question.countDocuments({ company: company.slug, difficulty: 'medium' });
        const hardCount = await Question.countDocuments({ company: company.slug, difficulty: 'hard' });

        return {
          ...company.toObject(),
          questionCount,
          questionsByDifficulty: { easy: easyCount, medium: mediumCount, hard: hardCount },
        };
      })
    );

    res.json(companiesWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single company by slug
export const getCompanyBySlug = async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const questionCount = await Question.countDocuments({ company: company.slug });
    const easyCount = await Question.countDocuments({ company: company.slug, difficulty: 'easy' });
    const mediumCount = await Question.countDocuments({ company: company.slug, difficulty: 'medium' });
    const hardCount = await Question.countDocuments({ company: company.slug, difficulty: 'hard' });

    res.json({
      ...company.toObject(),
      questionCount,
      questionsByDifficulty: { easy: easyCount, medium: mediumCount, hard: hardCount },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get questions for a specific company
export const getCompanyQuestions = async (req, res) => {
  try {
    const { difficulty, skills } = req.query;
    const query = { company: req.params.slug };

    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (skills) {
      query.skills = { $in: skills.split(',').map(s => s.trim().toLowerCase()) };
    }

    const questions = await Question.find(query).limit(30);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
