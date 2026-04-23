import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
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
  hiringPattern: {
    rounds: [{ type: String }],
    focusAreas: [{ type: String }],
    avgCTC: { type: String },
  },
  logo: {
    type: String, // emoji icon
    default: '🏢',
  },
  color: {
    type: String, // brand accent color hex
    default: '#8B5CF6',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('Company', companySchema);
