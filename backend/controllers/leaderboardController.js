import User from '../models/User.js';

// Get global leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({
      'performance.totalQuizzesTaken': { $gt: 0 },
    })
      .select('name performance.xp performance.currentStreak performance.longestStreak performance.totalQuizzesTaken performance.correctAnswers performance.totalQuestionsAttempted createdAt')
      .sort({ 'performance.xp': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      'performance.totalQuizzesTaken': { $gt: 0 },
    });

    // Find current user's rank
    const currentUserXp = await User.findById(req.userId).select('performance.xp');
    let currentUserRank = null;
    if (currentUserXp) {
      const xp = currentUserXp.performance?.xp || 0;
      currentUserRank = await User.countDocuments({
        'performance.xp': { $gt: xp },
      }) + 1;
    }

    // Build leaderboard with ranks
    const leaderboard = users.map((user, index) => {
      const accuracy = user.performance.totalQuestionsAttempted > 0
        ? Math.round((user.performance.correctAnswers / user.performance.totalQuestionsAttempted) * 100)
        : 0;

      return {
        _id: user._id,
        rank: skip + index + 1,
        name: user.name,
        xp: user.performance.xp || 0,
        currentStreak: user.performance.currentStreak || 0,
        longestStreak: user.performance.longestStreak || 0,
        totalQuizzes: user.performance.totalQuizzesTaken || 0,
        accuracy,
        isCurrentUser: user._id.toString() === req.userId.toString(),
      };
    });

    res.json({
      leaderboard,
      currentUserRank,
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

// Get top performers (compact, for dashboard widget)
export const getTopPerformers = async (req, res) => {
  try {
    const top = await User.find({
      'performance.totalQuizzesTaken': { $gt: 0 },
    })
      .select('name performance.xp performance.currentStreak')
      .sort({ 'performance.xp': -1 })
      .limit(5);

    res.json(top.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      xp: user.performance.xp || 0,
      streak: user.performance.currentStreak || 0,
      isCurrentUser: user._id.toString() === req.userId.toString(),
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
