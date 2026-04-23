import InterviewExperience from '../models/InterviewExperience.js';

// Create a new interview experience
export const createExperience = async (req, res) => {
  try {
    const { company, role, difficulty, result, rounds, overallTips } = req.body;

    if (!company || !role || !difficulty || !result || !rounds || rounds.length === 0) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const experience = new InterviewExperience({
      author: req.userId,
      company,
      role,
      difficulty,
      result,
      rounds,
      overallTips: overallTips || '',
    });

    await experience.save();

    // Populate author name before returning
    await experience.populate('author', 'name');

    res.status(201).json(experience);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all experiences with optional filters
export const getAllExperiences = async (req, res) => {
  try {
    const { company, result, page = 1, limit = 12 } = req.query;
    const query = {};

    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }
    if (result && result !== 'all') {
      query.result = result;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await InterviewExperience.countDocuments(query);
    const experiences = await InterviewExperience.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      experiences,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single experience by ID
export const getExperienceById = async (req, res) => {
  try {
    const experience = await InterviewExperience.findById(req.params.id)
      .populate('author', 'name');

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    res.json(experience);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle upvote on an experience
export const toggleUpvote = async (req, res) => {
  try {
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const userId = req.userId;
    const hasUpvoted = experience.upvotes.includes(userId);

    if (hasUpvoted) {
      experience.upvotes = experience.upvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      experience.upvotes.push(userId);
    }

    await experience.save();
    res.json({ upvotes: experience.upvotes.length, hasUpvoted: !hasUpvoted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
