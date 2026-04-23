import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
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
import Discussions from './pages/Discussions';

// Simple Auth Guard
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/analyze" 
              element={
                <PrivateRoute>
                  <JDAnalysis />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/quiz" 
              element={
                <PrivateRoute>
                  <Quiz />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/companies" 
              element={
                <PrivateRoute>
                  <Companies />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/companies/:slug" 
              element={
                <PrivateRoute>
                  <CompanyDetail />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <PrivateRoute>
                  <History />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/bookmarks" 
              element={
                <PrivateRoute>
                  <Bookmarks />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/experiences" 
              element={
                <PrivateRoute>
                  <Experiences />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/experiences/new" 
              element={
                <PrivateRoute>
                  <NewExperience />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/experiences/:id" 
              element={
                <PrivateRoute>
                  <ExperienceDetail />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <PrivateRoute>
                  <Leaderboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/mock-interview" 
              element={
                <PrivateRoute>
                  <MockInterview />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/discussions" 
              element={
                <PrivateRoute>
                  <Discussions />
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
