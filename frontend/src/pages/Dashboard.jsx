import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Target, Activity, CheckCircle, TrendingUp, Trophy, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
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
  const navigate = useNavigate();

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

  const { performance, recentQuizzes } = profile;
  const accuracy = performance.totalQuestionsAttempted > 0 
    ? Math.round((performance.correctAnswers / performance.totalQuestionsAttempted) * 100) 
    : 0;

  const radarData = performance.skillStrengths ? Object.entries(performance.skillStrengths).map(([skill, score]) => ({
    subject: skill,
    A: score,
    fullMark: 100,
  })) : [];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="text-gradient">Welcome back, {profile.name}!</h1>
        <p>Track your placement preparation journey.</p>
      </header>

      <div className="stats-grid">
        <StatCard index={0} title="Experience Points" value={`${performance.xp || 0} XP`} icon={<Trophy size={24} color="var(--neon-purple)" />} />
        <StatCard index={1} title="Current Streak" value={`${performance.currentStreak || 0} 🔥`} icon={<Activity size={24} color="var(--neon-pink)" />} />
        <StatCard index={2} title="Correct Answers" value={performance.correctAnswers} icon={<CheckCircle size={24} color="#10B981" />} />
        <StatCard index={3} title="Accuracy" value={`${accuracy}%`} icon={<TrendingUp size={24} color="var(--neon-blue)" />} />
      </div>

      <div className="dashboard-widgets">
        {/* Recent Quizzes */}
        <div className="widget glass-panel">
          <h2>Recent Quizzes</h2>
          {recentQuizzes && recentQuizzes.length > 0 ? (
            <div className="recent-quizzes-list">
              {recentQuizzes.map((quiz, idx) => (
                <motion.div
                  key={quiz._id}
                  className="recent-quiz-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="rq-score-dot" style={{
                    background: quiz.accuracy >= 70 ? '#34d399' : quiz.accuracy >= 40 ? '#fcd34d' : '#f87171'
                  }}>
                    {quiz.accuracy}%
                  </div>
                  <div className="rq-info">
                    <span className="rq-title">
                      {quiz.company ? quiz.company : 'General'} — {quiz.score}/{quiz.totalQuestions}
                    </span>
                    <span className="rq-date">
                      {new Date(quiz.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              <button className="btn btn-secondary view-all-btn" onClick={() => navigate('/history')}>
                View All History <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <p className="empty-message">No quizzes taken yet. Start practicing to see your history here!</p>
          )}
        </div>

        {/* Weak Areas */}
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

        {/* Skill Radar Chart */}
        <div className="widget glass-panel skill-radar-widget">
          <h2>Your Skill Profile</h2>
          {radarData.length >= 3 ? (
            <div className="h-64 w-full mt-4" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid var(--neon-purple)', borderRadius: '8px' }} />
                  <Radar name="Proficiency" dataKey="A" stroke="var(--neon-purple)" fill="var(--neon-purple)" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-message mb-4">You need at least 3 skills to unlock the AI Radar Chart.</p>
              <ul className="skill-list">
                {Object.entries(performance.skillStrengths || {}).map(([skill, score]) => (
                  <li key={skill} className="skill-item">
                    <span>{skill}</span>
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${score}%`, backgroundColor: 'var(--neon-purple)' }}></div>
                    </div>
                    <span className="skill-score">{score}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => navigate('/companies')}>
          🏢 Browse Companies
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/analyze')}>
          📄 Analyze a JD
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/quiz')}>
          🎯 Quick Practice
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
