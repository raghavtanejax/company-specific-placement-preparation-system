import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { Clock, Target, TrendingUp, Award, BarChart3, Calendar } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PolarGrid, PolarAngleAxis, Radar, RadarChart
} from 'recharts';
import './History.css';

const History = () => {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, analyticsRes] = await Promise.all([
          api.get('/quiz/history?limit=20'),
          api.get('/quiz/analytics'),
        ]);
        setHistory(histRes.data.attempts);
        setAnalytics(analyticsRes.data);
      } catch (error) {
        console.error('Failed to load history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading your history...</div>;

  const topicData = analytics?.topicAccuracy
    ? Object.entries(analytics.topicAccuracy).map(([topic, accuracy]) => ({
        topic: topic.charAt(0).toUpperCase() + topic.slice(1),
        accuracy,
      }))
    : [];

  const trendData = analytics?.accuracyOverTime || [];

  return (
    <div className="history-container">
      <header className="page-header">
        <h1 className="text-gradient">Quiz History & Analytics</h1>
        <p className="page-subtitle">Track your progress and identify areas for improvement.</p>
      </header>

      {/* Stats Overview */}
      {analytics && (
        <div className="stats-row">
          <motion.div className="mini-stat glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <BarChart3 size={22} color="var(--neon-purple)" />
            <div>
              <span className="mini-stat-value">{analytics.totalQuizzes}</span>
              <span className="mini-stat-label">Total Quizzes</span>
            </div>
          </motion.div>
          <motion.div className="mini-stat glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Target size={22} color="var(--neon-blue)" />
            <div>
              <span className="mini-stat-value">{analytics.avgAccuracy}%</span>
              <span className="mini-stat-label">Avg Accuracy</span>
            </div>
          </motion.div>
          <motion.div className="mini-stat glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Award size={22} color="#34d399" />
            <div>
              <span className="mini-stat-value">{analytics.bestScore}%</span>
              <span className="mini-stat-label">Best Score</span>
            </div>
          </motion.div>
          <motion.div className="mini-stat glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Clock size={22} color="var(--neon-pink)" />
            <div>
              <span className="mini-stat-value">{analytics.avgTimePerQuestion}s</span>
              <span className="mini-stat-label">Avg Time/Q</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="tab-switcher">
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} /> Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Calendar size={16} /> Quiz Log
        </button>
      </div>

      {activeTab === 'analytics' && analytics && (
        <div className="analytics-grid">
          {/* Accuracy Trend */}
          <motion.div className="chart-panel glass-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="chart-title">Accuracy Over Time</h3>
            {trendData.length >= 2 ? (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid var(--neon-purple)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="var(--neon-purple)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--neon-purple)', r: 4 }}
                      activeDot={{ r: 6, stroke: 'var(--neon-purple)', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="empty-message">Need at least 2 quizzes to show trend data.</p>
            )}
          </motion.div>

          {/* Topic Accuracy */}
          <motion.div className="chart-panel glass-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <h3 className="chart-title">Topic-wise Accuracy</h3>
            {topicData.length > 0 ? (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topicData.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis type="category" dataKey="topic" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid var(--neon-blue)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="accuracy" fill="var(--neon-blue)" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="empty-message">No topic data yet. Complete some quizzes to see your topic accuracy.</p>
            )}
          </motion.div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-state glass-panel">
              <Clock size={48} className="empty-icon" />
              <p>No quiz attempts yet. Go practice some questions!</p>
            </div>
          ) : (
            history.map((attempt, idx) => (
              <motion.div
                key={attempt._id}
                className="history-card glass-panel"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className="history-card-left">
                  <div className="history-score-circle" style={{
                    background: `conic-gradient(${attempt.accuracy >= 70 ? '#34d399' : attempt.accuracy >= 40 ? '#fcd34d' : '#f87171'} ${attempt.accuracy * 3.6}deg, rgba(255,255,255,0.05) 0deg)`
                  }}>
                    <span className="score-inner">{attempt.accuracy}%</span>
                  </div>
                </div>
                <div className="history-card-middle">
                  <div className="history-card-title">
                    {attempt.company ? (
                      <span className="company-tag">{attempt.company}</span>
                    ) : null}
                    <span>{attempt.score}/{attempt.totalQuestions} correct</span>
                  </div>
                  <div className="history-card-skills">
                    {attempt.skills?.slice(0, 3).map((s) => (
                      <span key={s} className="skill-chip">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="history-card-right">
                  <span className="history-date">
                    {new Date(attempt.completedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                  {attempt.duration > 0 && (
                    <span className="history-duration">
                      <Clock size={12} /> {Math.floor(attempt.duration / 60)}m {attempt.duration % 60}s
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default History;
