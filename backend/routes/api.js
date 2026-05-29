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
import { getInterviewReport } from '../controllers/reportController.js';
import { createDiscussion, getDiscussionsByQuestion, getAllDiscussions, addReply, toggleDiscussionUpvote, toggleReplyUpvote } from '../controllers/discussionController.js';
import { 
  getDashboardStats, 
  getAllUsers, deleteUser, updateUserRole, 
  getAllCompaniesAdmin, deleteCompany, 
  getAllQuestionsAdmin, deleteQuestion 
} from '../controllers/adminController.js';
import {
  getPublicQuestions,
  getPublicQuestionById,
  getQuestionSlugs,
  getPublicCompanies,
  getPublicCompanyBySlug,
  getPublicExperiences,
  getPublicExperienceById,
  getExperienceIds,
} from '../controllers/publicController.js';
import { auth } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// Health check endpoint for pre-warming backend/DB
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (no auth) — consumed by Next.js SSR / sitemap generator
// These are READ-ONLY and never expose user-sensitive data.
// Rate-limit these in production with express-rate-limit if needed.
// ─────────────────────────────────────────────────────────────────────────────

// Questions — public
router.get('/public/questions/slugs',  getQuestionSlugs);      // lightweight: just IDs + titles
router.get('/public/questions/:id',    getPublicQuestionById);  // single question by ObjectId
router.get('/public/questions',        getPublicQuestions);     // paginated list

// Companies — public
router.get('/public/companies/:slug',  getPublicCompanyBySlug); // single company by slug
router.get('/public/companies',        getPublicCompanies);     // all companies

// Experiences — public
router.get('/public/experiences/ids',  getExperienceIds);           // lightweight: just IDs
router.get('/public/experiences/:id',  getPublicExperienceById);    // single experience
router.get('/public/experiences',      getPublicExperiences);        // paginated list

// Admin routes
router.get('/admin/dashboard', auth, adminAuth, getDashboardStats);

router.get('/admin/users', auth, adminAuth, getAllUsers);
router.delete('/admin/users/:id', auth, adminAuth, deleteUser);
router.put('/admin/users/:id/role', auth, adminAuth, updateUserRole);

router.get('/admin/companies', auth, adminAuth, getAllCompaniesAdmin);
router.delete('/admin/companies/:id', auth, adminAuth, deleteCompany);

router.get('/admin/questions', auth, adminAuth, getAllQuestionsAdmin);
router.delete('/admin/questions/:id', auth, adminAuth, deleteQuestion);

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
router.get('/mock-interview/:id/report', auth, getInterviewReport);
router.get('/mock-interview/:id', auth, getInterviewById);

// Discussion Forum routes
router.post('/discussions', auth, createDiscussion);
router.get('/discussions', auth, getAllDiscussions);
router.get('/discussions/question/:questionId', auth, getDiscussionsByQuestion);
router.post('/discussions/:discussionId/reply', auth, addReply);
router.post('/discussions/:discussionId/upvote', auth, toggleDiscussionUpvote);
router.post('/discussions/:discussionId/reply/:replyId/upvote', auth, toggleReplyUpvote);

export default router;
