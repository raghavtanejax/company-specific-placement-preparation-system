import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Target, Activity, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import './Dashboard.css';

const StatCard = ({ title, value, icon, index }) => (
  <motion.div 
    className="stat-card glass-panel"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3 className="stat-title">{title}</h3>
      <p className="stat-value">{value}</p>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/user/dashboard');
        setProfile(data);
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!profile) return <div className="loading">Error loading dashboard</div>;

  const { performance } = profile;
  const accuracy = performance.totalQuestionsAttempted > 0 
    ? Math.round((performance.correctAnswers / performance.totalQuestionsAttempted) * 100) 
    : 0;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="text-gradient">Welcome back, {profile.name}!</h1>
        <p>Track your placement preparation journey.</p>
      </header>

      <div className="stats-grid">
        <StatCard index={0} title="Total Quizzes" value={performance.totalQuizzesTaken} icon={<Activity size={24} color="var(--neon-purple)" />} />
        <StatCard index={1} title="Total Score" value={performance.totalScore} icon={<Target size={24} color="var(--neon-blue)" />} />
        <StatCard index={2} title="Correct Answers" value={performance.correctAnswers} icon={<CheckCircle size={24} color="var(--neon-pink)" />} />
        <StatCard index={3} title="Accuracy" value={`${accuracy}%`} icon={<TrendingUp size={24} color="#10B981" />} />
      </div>

      <div className="dashboard-widgets">
        <div className="widget glass-panel">
          <h2>Weak Areas to Target</h2>
          {performance.skillWeaknesses && performance.skillWeaknesses.length > 0 ? (
            <div className="tags-container">
              {performance.skillWeaknesses.map(skill => (
                <span key={skill} className="tag tag-warning">{skill}</span>
              ))}
            </div>
          ) : (
            <p className="empty-message">You have no recorded weak areas yet! Keep practicing to uncover insights.</p>
          )}
        </div>

        <div className="widget glass-panel">
          <h2>Your Skill Strengths</h2>
          {performance.skillStrengths && Object.keys(performance.skillStrengths).length > 0 ? (
           <ul className="skill-list">
              {Object.entries(performance.skillStrengths).map(([skill, score]) => (
                <li key={skill} className="skill-item">
                  <span>{skill}</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${score}%`, backgroundColor: 'var(--neon-purple)' }}></div>
                  </div>
                  <span className="skill-score">{score}%</span>
                </li>
              ))}
           </ul>
          ) : (
            <p className="empty-message">Analyze a job description or take quizzes to build your skill profile.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
