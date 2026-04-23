import mongoose from 'mongoose';

const interviewExperienceSchema = new mongoose.Schema({
  author: {
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
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  result: {
    type: String,
    enum: ['selected', 'rejected', 'pending'],
    required: true,
  },
  rounds: [{
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    questionsAsked: [{
      type: String,
    }],
    tips: {
      type: String,
    },
  }],
  overallTips: {
    type: String,
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Index for efficient queries
interviewExperienceSchema.index({ company: 1, createdAt: -1 });
interviewExperienceSchema.index({ author: 1 });

export default mongoose.model('InterviewExperience', interviewExperienceSchema);
