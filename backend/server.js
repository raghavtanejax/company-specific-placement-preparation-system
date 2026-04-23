import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import apiRoutes from './routes/api.js';

dotenv.config();

// Use Google's public DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Global error handler for Express 5
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Database connection - wait for connection before starting server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log('Connected to MongoDB');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

startServer();
