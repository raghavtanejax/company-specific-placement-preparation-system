import QuizAttempt from '../models/QuizAttempt.js';

// Save a completed quiz attempt
export const saveQuizAttempt = async (req, res) => {
  try {
    const { company, skills, questions, score, totalQuestions, accuracy, duration } = req.body;

    const attempt = new QuizAttempt({
      userId: req.userId,
      company: company || null,
      skills: skills || [],
      questions: questions || [],
      score,
      totalQuestions,
      accuracy,
      duration: duration || 0,
    });

    await attempt.save();
    res.status(201).json({ message: 'Quiz attempt saved', attempt });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get paginated quiz history for the logged-in user
export const getQuizHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await QuizAttempt.countDocuments({ userId: req.userId });
    const attempts = await QuizAttempt.find({ userId: req.userId })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('questions.questionId', 'title difficulty skills type');

    res.json({
      attempts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get analytics data for the user
export const getAnalytics = async (req, res) => {
  try {
    const allAttempts = await QuizAttempt.find({ userId: req.userId })
      .sort({ completedAt: 1 })
      .populate('questions.questionId', 'title difficulty skills type');

    if (allAttempts.length === 0) {
      return res.json({
        accuracyOverTime: [],
        topicAccuracy: {},
        totalQuizzes: 0,
        avgAccuracy: 0,
        totalQuestionsSolved: 0,
        bestScore: 0,
        avgTimePerQuestion: 0,
        companyBreakdown: {},
      });
    }

    // Accuracy over time (for line chart)
    const accuracyOverTime = allAttempts.map((a) => ({
      date: a.completedAt.toISOString().split('T')[0],
      accuracy: a.accuracy,
      score: a.score,
      total: a.totalQuestions,
    }));

    // Topic-wise accuracy (for bar chart)
    const topicStats = {};
    allAttempts.forEach((attempt) => {
      attempt.questions.forEach((q) => {
        if (q.questionId && q.questionId.skills) {
          q.questionId.skills.forEach((skill) => {
            if (!topicStats[skill]) {
              topicStats[skill] = { correct: 0, total: 0 };
            }
            topicStats[skill].total += 1;
            if (q.isCorrect) topicStats[skill].correct += 1;
          });
        }
      });
    });

    const topicAccuracy = {};
    Object.entries(topicStats).forEach(([skill, data]) => {
      topicAccuracy[skill] = Math.round((data.correct / data.total) * 100);
    });

    // Company breakdown
    const companyBreakdown = {};
    allAttempts.forEach((a) => {
      const key = a.company || 'general';
      if (!companyBreakdown[key]) {
        companyBreakdown[key] = { quizzes: 0, totalScore: 0, totalQuestions: 0 };
      }
      companyBreakdown[key].quizzes += 1;
      companyBreakdown[key].totalScore += a.score;
      companyBreakdown[key].totalQuestions += a.totalQuestions;
    });

    // Aggregate stats
    const totalQuizzes = allAttempts.length;
    const totalQuestionsSolved = allAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    const avgAccuracy = Math.round(
      allAttempts.reduce((sum, a) => sum + a.accuracy, 0) / totalQuizzes
    );
    const bestScore = Math.max(...allAttempts.map((a) => a.accuracy));
    const totalTime = allAttempts.reduce((sum, a) => sum + a.duration, 0);
    const avgTimePerQuestion = totalQuestionsSolved > 0
      ? Math.round(totalTime / totalQuestionsSolved)
      : 0;

    res.json({
      accuracyOverTime,
      topicAccuracy,
      totalQuizzes,
      avgAccuracy,
      totalQuestionsSolved,
      bestScore,
      avgTimePerQuestion,
      companyBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
