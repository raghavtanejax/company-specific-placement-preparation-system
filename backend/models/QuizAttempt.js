import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: String, // company slug, optional
    default: null,
  },
  skills: [{
    type: String,
  }],
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    selectedAnswer: {
      type: mongoose.Schema.Types.Mixed, // index for MCQ, code string for coding
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    timeTaken: {
      type: Number, // seconds spent on this question
      default: 0,
    },
  }],
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number, // percentage
    required: true,
  },
  duration: {
    type: Number, // total quiz time in seconds
    default: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  }
});

// Index for efficient queries
quizAttemptSchema.index({ userId: 1, completedAt: -1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
