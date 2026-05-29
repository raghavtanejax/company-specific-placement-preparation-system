import User from '../models/User.js';
import QuizAttempt from '../models/QuizAttempt.js';
import bcrypt from 'bcryptjs';

export const getUserDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get recent quiz attempts for dashboard widget
    const recentQuizzes = await QuizAttempt.find({ userId: req.userId })
      .sort({ completedAt: -1 })
      .limit(5)
      .select('company skills score totalQuestions accuracy completedAt');

    res.json({
      ...user.toObject(),
      recentQuizzes,
    });
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

    // XP system: 10 XP per correct answer + 5 XP bonus per quiz
    user.performance.xp += (correctAnswers * 10) + 5;

    // Streak logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = user.performance.lastActiveDate
      ? new Date(user.performance.lastActiveDate)
      : null;

    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        user.performance.currentStreak += 1;
      } else if (diffDays > 1) {
        user.performance.currentStreak = 1;
      }
      // Same day = no change to streak
    } else {
      user.performance.currentStreak = 1;
    }

    if (user.performance.currentStreak > user.performance.longestStreak) {
      user.performance.longestStreak = user.performance.currentStreak;
    }
    user.performance.lastActiveDate = new Date();

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

// Toggle bookmark for a question
export const toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const questionId = req.params.questionId;
    const index = user.bookmarks.indexOf(questionId);

    if (index > -1) {
      user.bookmarks.splice(index, 1);
    } else {
      user.bookmarks.push(questionId);
    }

    await user.save();
    res.json({
      bookmarks: user.bookmarks,
      isBookmarked: index === -1, // true if we just added it
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all bookmarked questions (populated)
export const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('bookmarks');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.bookmarks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, oldPassword, newPassword } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Name update
    if (name) {
      user.name = name.trim();
    }

    // Email update
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        // Check if email already taken
        const emailExists = await User.findOne({ email: normalizedEmail });
        if (emailExists) {
          return res.status(400).json({ message: 'Email is already taken by another account' });
        }
        user.email = normalizedEmail;
      }
    }

    // Password update
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }

      // Check current password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteSelf = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's quiz attempts
    await QuizAttempt.deleteMany({ userId: req.userId });

    // Delete user
    await User.findByIdAndDelete(req.userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
