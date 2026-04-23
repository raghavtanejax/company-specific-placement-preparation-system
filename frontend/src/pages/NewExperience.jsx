import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Send, Loader } from 'lucide-react';

const NewExperience = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [result, setResult] = useState('selected');
  const [overallTips, setOverallTips] = useState('');
  const [rounds, setRounds] = useState([
    { name: '', description: '', questionsAsked: [''], tips: '' },
  ]);

  const addRound = () => {
    setRounds([...rounds, { name: '', description: '', questionsAsked: [''], tips: '' }]);
  };

  const removeRound = (idx) => {
    if (rounds.length <= 1) return;
    setRounds(rounds.filter((_, i) => i !== idx));
  };

  const updateRound = (idx, field, value) => {
    const updated = [...rounds];
    updated[idx] = { ...updated[idx], [field]: value };
    setRounds(updated);
  };

  const addQuestion = (roundIdx) => {
    const updated = [...rounds];
    updated[roundIdx].questionsAsked.push('');
    setRounds(updated);
  };

  const updateQuestion = (roundIdx, qIdx, value) => {
    const updated = [...rounds];
    updated[roundIdx].questionsAsked[qIdx] = value;
    setRounds(updated);
  };

  const removeQuestion = (roundIdx, qIdx) => {
    const updated = [...rounds];
    updated[roundIdx].questionsAsked = updated[roundIdx].questionsAsked.filter((_, i) => i !== qIdx);
    setRounds(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company || !role || rounds.length === 0 || !rounds[0].name) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clean up empty questions
      const cleanedRounds = rounds.map((r) => ({
        ...r,
        questionsAsked: r.questionsAsked.filter((q) => q.trim() !== ''),
      }));

      await api.post('/experiences', {
        company,
        role,
        difficulty,
        result,
        rounds: cleanedRounds,
        overallTips,
      });
      navigate('/experiences');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit experience.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', paddingBottom: '2rem' }}>
      <button className="back-btn" onClick={() => navigate('/experiences')}>
        <ArrowLeft size={18} /> Back to Experiences
      </button>

      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Share Your Interview Experience</h1>
        <p className="page-subtitle">Help others prepare by sharing what you went through.</p>
      </header>

      {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <motion.div
          className="glass-panel"
          style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Basic Info</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Google"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., SDE-1"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Result</label>
              <select className="form-input" value={result} onChange={(e) => setResult(e.target.value)}>
                <option value="selected">Selected ✅</option>
                <option value="rejected">Rejected ❌</option>
                <option value="pending">Pending ⏳</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Interview Rounds */}
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Interview Rounds</h2>

        {rounds.map((round, i) => (
          <motion.div
            key={i}
            className="glass-panel"
            style={{ padding: '1.5rem', marginBottom: '1rem' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                  {i + 1}
                </span>
                Round {i + 1}
              </h3>
              {rounds.length > 1 && (
                <button type="button" onClick={() => removeRound(i)} className="remove-btn">
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Round Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Online Assessment"
                value={round.name}
                onChange={(e) => updateRound(i, 'name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                style={{ minHeight: 80, resize: 'vertical' }}
                placeholder="What happened in this round?"
                value={round.description}
                onChange={(e) => updateRound(i, 'description', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Questions Asked</label>
              {round.questionsAsked.map((q, j) => (
                <div key={j} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Reverse a linked list"
                    value={q}
                    onChange={(e) => updateQuestion(i, j, e.target.value)}
                  />
                  {round.questionsAsked.length > 1 && (
                    <button type="button" className="remove-btn" onClick={() => removeQuestion(i, j)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => addQuestion(i)}>
                <Plus size={14} /> Add Question
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tips for this round</label>
              <input
                type="text"
                className="form-input"
                placeholder="Any advice for candidates?"
                value={round.tips}
                onChange={(e) => updateRound(i, 'tips', e.target.value)}
              />
            </div>
          </motion.div>
        ))}

        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginBottom: '1.5rem' }} onClick={addRound}>
          <Plus size={16} /> Add Another Round
        </button>

        {/* Overall Tips */}
        <motion.div
          className="glass-panel"
          style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Overall Tips & Advice</label>
            <textarea
              className="form-input"
              style={{ minHeight: 100, resize: 'vertical' }}
              placeholder="Any overall advice for someone preparing for this company?"
              value={overallTips}
              onChange={(e) => setOverallTips(e.target.value)}
            />
          </div>
        </motion.div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
          {loading ? <><Loader size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Experience</>}
        </button>
      </form>
    </div>
  );
};

export default NewExperience;
