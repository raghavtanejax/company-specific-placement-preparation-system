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
    score:         { type: Number, min: 0, max: 10 },
    isCorrect:     { type: Boolean },
    correctAnswer: { type: String },   // only populated when isCorrect === false
    strengths:     [String],
    improvements:  [String],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const weakAreaSchema = new mongoose.Schema({
  topic:           { type: String, required: true },
  averageScore:    { type: Number, min: 0, max: 10 },
  recommendations: [String],  // 1–3 items
}, { _id: false });

const topicPerformanceSchema = new mongoose.Schema({
  topic:         { type: String, required: true },
  averageScore:  { type: Number, min: 0, max: 10 },
  questionCount: { type: Number },
}, { _id: false });

const perQuestionSchema = new mongoose.Schema({
  questionText:  { type: String },
  answerText:    { type: String },
  score:         { type: Number, min: 0, max: 10 },
  isCorrect:     { type: Boolean },
  correctAnswer: { type: String },   // only when isCorrect === false
  strengths:     [String],           // 1–3 items
  improvements:  [String],           // 1–3 items
}, { _id: false });

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
  aiModel: {
    type: String,
    default: 'gemini-2.5-flash',
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
  report: {
    totalScore:          { type: Number, min: 0, max: 100 },
    recommendation:      { type: String },
    summary:             { type: String },
    perQuestionBreakdown:[perQuestionSchema],
    topicPerformance:    [topicPerformanceSchema],
    weakAreas:           [weakAreaSchema],
    generatedAt:         { type: Date },
  },
});

// Indexes
mockInterviewSchema.index({ userId: 1, startedAt: -1 });
mockInterviewSchema.index({ userId: 1, status: 1 });

export default mongoose.model('MockInterview', mockInterviewSchema);
