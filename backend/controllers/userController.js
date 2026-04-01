import User from '../models/User.js';

export const getUserDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updatePerformance = async (req, res) => {
  try {
    const { questionsAttempted, correctAnswers, updateSkills } = req.body;
    // updateSkills: { "react": 100, "dsa": 50 }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.performance.totalQuizzesTaken += 1;
    user.performance.totalQuestionsAttempted += questionsAttempted;
    user.performance.correctAnswers += correctAnswers;
    user.performance.totalScore += correctAnswers * 10; // example scoring

    // Update skill strengths
    if (updateSkills) {
      for (const [skill, score] of Object.entries(updateSkills)) {
        user.performance.skillStrengths.set(skill, score);
      }
    }

    // Determine weak areas (skills < 60%)
    const weaknesses = [];
    user.performance.skillStrengths.forEach((score, skill) => {
      if (score < 60) {
        weaknesses.push(skill);
      }
    });
    user.performance.skillWeaknesses = weaknesses;

    await user.save();
    
    res.json({ message: 'Performance updated successfully', performance: user.performance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
