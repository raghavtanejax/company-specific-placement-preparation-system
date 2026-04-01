import express from 'express';
import { register, login } from '../controllers/authController.js';
import { analyzeJobDescription } from '../controllers/analysisController.js';
import { getRecommendedQuestions, seedQuestions } from '../controllers/questionController.js';
import { getUserDashboard, updatePerformance } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// Analysis routes (Requires auth for full system, but could be open)
router.post('/analysis/analyze-jd', auth, analyzeJobDescription);

// Question routes
router.get('/questions/recommend', auth, getRecommendedQuestions);
router.post('/questions/seed', seedQuestions); // Utility route to seed DB

// User Performance routes
router.get('/user/dashboard', auth, getUserDashboard);
router.put('/user/performance', auth, updatePerformance);

export default router;
