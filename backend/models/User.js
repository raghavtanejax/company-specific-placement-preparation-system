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
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('User', userSchema);
