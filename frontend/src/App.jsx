import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import JDAnalysis from './pages/JDAnalysis';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Register from './pages/Register';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import History from './pages/History';
import Bookmarks from './pages/Bookmarks';
import Experiences from './pages/Experiences';
import ExperienceDetail from './pages/ExperienceDetail';
import NewExperience from './pages/NewExperience';
import Leaderboard from './pages/Leaderboard';
import MockInterview from './pages/MockInterview';
import PeerInterview from './pages/PeerInterview';
import Discussions from './pages/Discussions';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';

// ─── Auth Guards ──────────────────────────────────────────────────────────────

/** Redirects unauthenticated users to /login */
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

/** Redirects non-admin users back to their dashboard */
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }
  return token && user && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

// ─── Application Root ─────────────────────────────────────────────────────────

function App() {
  return (
    <Router>
      {/*
        Stage 1 SEO – Site-wide default metadata
        ─────────────────────────────────────────
        This <Helmet> block acts as the global fallback. Any <SEO /> or
        <Helmet> block rendered deeper in the tree OVERRIDES these values
        for its route. If no child overrides a tag, these defaults show up.

        These tags are always present in the HTML source, which means:
          • Social link-unfurlers (WhatsApp, Slack, LinkedIn) will always
            find *something* meaningful.
          • Google will see a sensible description even on first crawl of
            the app shell (before JS hydration).
      */}
      <Helmet
        defaultTitle="PrepAI – Company-Specific Placement Preparation"
        titleTemplate="%s | PrepAI"
      >
        <html lang="en" />
        <meta name="description" content="PrepAI is your AI-powered placement preparation system. Practice 2,300+ company-specific interview questions, get Gemini AI-powered JD analysis, and read real community interview experiences to crack your dream job." />
        <meta name="keywords" content="placement preparation, interview questions, company specific questions, Gemini AI JD analysis, coding interview, PrepAI" />
        <meta name="author" content="PrepAI" />
        <meta name="theme-color" content="#8B5CF6" />

        {/* Default OG tags — overridden per-page by the <SEO /> component */}
        <meta property="og:site_name" content="PrepAI" />
        <meta property="og:type"      content="website" />
        <meta property="og:image"     content="https://prepai.in/og-default.png" />

        {/* Default Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@prepai_in" />

        {/* Preconnect to external origins to reduce latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Helmet>

      <div className="app-container flex flex-col min-h-screen">
        <Navbar />
        <main className="main-content flex-grow">
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Authenticated routes ── */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/analyze"   element={<PrivateRoute><JDAnalysis /></PrivateRoute>} />
            <Route path="/quiz"      element={<PrivateRoute><Quiz /></PrivateRoute>} />
            <Route path="/companies" element={<PrivateRoute><Companies /></PrivateRoute>} />
            <Route path="/companies/:slug" element={<PrivateRoute><CompanyDetail /></PrivateRoute>} />
            <Route path="/history"   element={<PrivateRoute><History /></PrivateRoute>} />
            <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
            <Route path="/experiences"     element={<PrivateRoute><Experiences /></PrivateRoute>} />
            <Route path="/experiences/new" element={<PrivateRoute><NewExperience /></PrivateRoute>} />
            <Route path="/experiences/:id" element={<PrivateRoute><ExperienceDetail /></PrivateRoute>} />
            <Route path="/leaderboard"     element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
            <Route path="/mock-interview"  element={<PrivateRoute><MockInterview /></PrivateRoute>} />
            <Route path="/peer-interview"  element={<PrivateRoute><PeerInterview /></PrivateRoute>} />
            <Route path="/discussions"     element={<PrivateRoute><Discussions /></PrivateRoute>} />
            <Route path="/settings"        element={<PrivateRoute><Settings /></PrivateRoute>} />

            {/* ── Admin route ── */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
