import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  skills: [{
    type: String, // e.g., 'React', 'DSA', 'Node.js'
  }],
  company: [{
    type: String, // e.g., 'google', 'amazon' — company slugs
  }],
  type: {
    type: String,
    enum: ['mcq', 'coding'],
    required: true,
  },
  options: [{ // For MCQs
    text: String,
    isCorrect: Boolean,
  }],
  testCases: [{ // For coding questions
    input: String,
    expectedOutput: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('Question', questionSchema);
