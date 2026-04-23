import express from 'express';
import { register, login } from '../controllers/authController.js';
import { analyzeJobDescription } from '../controllers/analysisController.js';
import { getRecommendedQuestions, seedQuestions } from '../controllers/questionController.js';
import { getUserDashboard, updatePerformance, toggleBookmark, getBookmarks } from '../controllers/userController.js';
import { getAllCompanies, getCompanyBySlug, getCompanyQuestions } from '../controllers/companyController.js';
import { saveQuizAttempt, getQuizHistory, getAnalytics } from '../controllers/historyController.js';
import { createExperience, getAllExperiences, getExperienceById, toggleUpvote } from '../controllers/experienceController.js';
import { getLeaderboard, getTopPerformers } from '../controllers/leaderboardController.js';
import { startInterview, respondToInterview, endInterview, getInterviewHistory, getInterviewById } from '../controllers/mockInterviewController.js';
import { createDiscussion, getDiscussionsByQuestion, getAllDiscussions, addReply, toggleDiscussionUpvote, toggleReplyUpvote } from '../controllers/discussionController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// Analysis routes
router.post('/analysis/analyze-jd', auth, analyzeJobDescription);

// Question routes
router.get('/questions/recommend', auth, getRecommendedQuestions);
router.post('/questions/seed', seedQuestions); // Utility route to seed DB

// User Performance routes
router.get('/user/dashboard', auth, getUserDashboard);
router.put('/user/performance', auth, updatePerformance);

// Bookmark routes
router.post('/user/bookmarks/:questionId', auth, toggleBookmark);
router.get('/user/bookmarks', auth, getBookmarks);

// Company routes
router.get('/companies', auth, getAllCompanies);
router.get('/companies/:slug', auth, getCompanyBySlug);
router.get('/companies/:slug/questions', auth, getCompanyQuestions);

// Quiz History routes
router.post('/quiz/save', auth, saveQuizAttempt);
router.get('/quiz/history', auth, getQuizHistory);
router.get('/quiz/analytics', auth, getAnalytics);

// Interview Experience routes
router.post('/experiences', auth, createExperience);
router.get('/experiences', auth, getAllExperiences);
router.get('/experiences/:id', auth, getExperienceById);
router.post('/experiences/:id/upvote', auth, toggleUpvote);

// Leaderboard routes
router.get('/leaderboard', auth, getLeaderboard);
router.get('/leaderboard/top', auth, getTopPerformers);

// Mock Interview routes
router.post('/mock-interview/start', auth, startInterview);
router.post('/mock-interview/respond', auth, respondToInterview);
router.post('/mock-interview/:interviewId/end', auth, endInterview);
router.get('/mock-interview/history', auth, getInterviewHistory);
router.get('/mock-interview/:id', auth, getInterviewById);

// Discussion Forum routes
router.post('/discussions', auth, createDiscussion);
router.get('/discussions', auth, getAllDiscussions);
router.get('/discussions/question/:questionId', auth, getDiscussionsByQuestion);
router.post('/discussions/:discussionId/reply', auth, addReply);
router.post('/discussions/:discussionId/upvote', auth, toggleDiscussionUpvote);
router.post('/discussions/:discussionId/reply/:replyId/upvote', auth, toggleReplyUpvote);

export default router;
