import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, ArrowRight, Loader, Sparkles, Clock, BarChart3, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './JDAnalysis.css';

const confidenceColors = {
  high: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
  medium: { color: '#fcd34d', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  low: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' },
};

const JDAnalysis = () => {
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/analysis/analyze-jd', { jobDescription: jdText });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze Job Description.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    if (result && result.extractedSkills?.length > 0) {
      const skills = result.extractedSkills.map((s) => (typeof s === 'string' ? s : s.name));
      navigate(`/quiz?skills=${skills.join(',')}`);
    } else {
      navigate('/quiz');
    }
  };

  // Prepare gap analysis chart data
  const gapData = result?.gapAnalysis?.map((item) => ({
    skill: item.skill,
    required: item.required,
    current: item.current,
  })) || [];

  return (
    <div className="analyze-container">
      <header className="page-header text-center">
        <h1 className="text-gradient">Analyze Job Description</h1>
        <p>Paste the JD below to extract required skills and generate a customized preparation plan.</p>
        {result?.aiPowered && (
          <span className="ai-badge">
            <Sparkles size={14} /> AI-Powered Analysis
          </span>
        )}
      </header>

      <div className="analyze-content">
        <div className="input-section glass-panel">
          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <label className="form-label">Job Description Text</label>
              <textarea
                className="form-input jd-textarea"
                placeholder="E.g., We are looking for a software engineer with experience in React, Node.js, and MongoDB..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !jdText.trim()}>
              {loading ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
              {loading ? 'Analyzing with AI...' : 'Analyze Requirements'}
            </button>
          </form>
          {error && <p className="error-message mt-4">{error}</p>}
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="results-area"
            >
              {/* Role Level */}
              {result.roleLevel && result.roleLevel !== 'Not determined' && (
                <motion.div className="result-card glass-panel" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <h2><Building2 size={18} /> Role Assessment</h2>
                  <div className="role-level-display">
                    <span className="role-level-tag">{result.roleLevel}</span>
                  </div>
                </motion.div>
              )}

              {/* Extracted Skills */}
              <motion.div
                className="result-card glass-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h2>Extracted Skills</h2>
                {result.extractedSkills && result.extractedSkills.length > 0 ? (
                  <div className="skills-grid">
                    {result.extractedSkills.map((skill, idx) => {
                      const name = typeof skill === 'string' ? skill : skill.name;
                      const confidence = typeof skill === 'string' ? 'high' : (skill.confidence || 'high');
                      const cc = confidenceColors[confidence] || confidenceColors.high;
                      return (
                        <span
                          key={idx}
                          className="skill-badge"
                          style={{ color: cc.color, background: cc.bg, border: `1px solid ${cc.border}` }}
                        >
                          {name}
                          <span className="confidence-dot" style={{ background: cc.color }}></span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-message">No specific technical skills identified. Try a more detailed JD.</p>
                )}
                <div className="confidence-legend">
                  <span><span className="legend-dot" style={{ background: '#34d399' }}></span> High</span>
                  <span><span className="legend-dot" style={{ background: '#fcd34d' }}></span> Medium</span>
                  <span><span className="legend-dot" style={{ background: '#f87171' }}></span> Low</span>
                </div>
              </motion.div>

              {/* Gap Analysis */}
              {gapData.length > 0 && (
                <motion.div
                  className="result-card glass-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2><BarChart3 size={18} /> Gap Analysis</h2>
                  <p className="card-subtitle">Your current skills vs. what this role requires.</p>
                  <div className="gap-chart-wrapper">
                    <ResponsiveContainer width="100%" height={Math.max(200, gapData.length * 40)}>
                      <BarChart data={gapData} layout="vertical" barGap={2}>
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <YAxis type="category" dataKey="skill" width={90} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid var(--neon-purple)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="required" fill="#8B5CF6" name="Required" radius={[0, 4, 4, 0]} barSize={14} />
                        <Bar dataKey="current" fill="#3B82F6" name="Your Level" radius={[0, 4, 4, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="gap-legend">
                    <span><span className="legend-bar" style={{ background: '#8B5CF6' }}></span> Required</span>
                    <span><span className="legend-bar" style={{ background: '#3B82F6' }}></span> Your Level</span>
                  </div>
                </motion.div>
              )}

              {/* Study Plan */}
              {result.studyPlan && result.studyPlan.length > 0 && (
                <motion.div
                  className="result-card glass-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2><Clock size={18} /> Personalized Study Plan</h2>
                  <div className="study-plan-grid">
                    {result.studyPlan.map((item, idx) => (
                      <div key={idx} className="plan-item">
                        <div className="plan-week-badge">Week {item.week}</div>
                        <div className="plan-details">
                          <h4 className="plan-topic">{item.topic}</h4>
                          <p className="plan-desc">{item.description}</p>
                          <span className="plan-hours">{item.hours}h estimated</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Company Suggestions */}
              {result.companySuggestions && result.companySuggestions.length > 0 && (
                <motion.div
                  className="result-card glass-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <h2><Building2 size={18} /> Similar Companies Hiring</h2>
                  <div className="company-suggestions">
                    {result.companySuggestions.map((c, idx) => (
                      <span key={idx} className="company-suggest-tag">{c}</span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <button onClick={handleStartPractice} className="btn btn-primary cta-full-btn pulse-btn">
                  Start Tailored Practice <ArrowRight size={18} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JDAnalysis;
