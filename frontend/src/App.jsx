import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import JDAnalysis from './pages/JDAnalysis';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Register from './pages/Register';

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
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
