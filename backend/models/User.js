import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  targetJobLocation: {
    type: String,
    default: '',
  },
  performance: {
    totalQuizzesTaken: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    totalQuestionsAttempted: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    skillStrengths: {
      type: Map,
      of: Number, // e.g., "React": 80 (percentage correct)
      default: {},
    },
    skillWeaknesses: [{ type: String }],
    xp: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date }
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('User', userSchema);
