import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['ai', 'user'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  feedback: {
    score: { type: Number, min: 0, max: 10 },
    strengths: [String],
    improvements: [String],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const mockInterviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  interviewType: {
    type: String,
    enum: ['technical', 'behavioral', 'system-design', 'hr'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  overallFeedback: {
    totalScore: { type: Number, min: 0, max: 100 },
    summary: String,
    strongAreas: [String],
    improvementAreas: [String],
    recommendation: String,
  },
  questionsAsked: { type: Number, default: 0 },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

// Indexes
mockInterviewSchema.index({ userId: 1, startedAt: -1 });
mockInterviewSchema.index({ userId: 1, status: 1 });

export default mongoose.model('MockInterview', mockInterviewSchema);
