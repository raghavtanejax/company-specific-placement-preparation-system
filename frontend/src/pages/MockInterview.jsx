import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Send, StopCircle, Mic, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import './MockInterview.css';

const INTERVIEW_TYPES = [
  { id: 'technical', icon: '💻', name: 'Technical', desc: 'DSA, Coding, CS Concepts' },
  { id: 'behavioral', icon: '🗣️', name: 'Behavioral', desc: 'STAR-format questions' },
  { id: 'system-design', icon: '🏗️', name: 'System Design', desc: 'Architecture & scale' },
  { id: 'hr', icon: '🤝', name: 'HR Round', desc: 'Culture fit & motivation' },
];

const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Flipkart', 'Goldman Sachs', 'TCS', 'Infosys', 'Wipro'];

const MockInterview = () => {
  const [phase, setPhase] = useState('setup'); // setup | chat | review
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [interviewType, setInterviewType] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [interviewId, setInterviewId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [overallFeedback, setOverallFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/mock-interview/history?limit=5');
      setHistory(data.interviews || []);
    } catch (e) {
      console.error('Failed to load interview history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStart = async () => {
    if (!company || !role || !interviewType) return;
    setSending(true);
    try {
      const { data } = await api.post('/mock-interview/start', { company, role, interviewType, difficulty });
      setInterviewId(data.interviewId);
      setMessages([{ role: 'ai', content: data.message }]);
      setQuestionsAsked(1);
      setPhase('chat');
    } catch (error) {
      console.error('Failed to start interview', error);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);

    try {
      const { data } = await api.post('/mock-interview/respond', { interviewId, response: userMsg });
      const aiMsg = { role: 'ai', content: data.message };
      setMessages(prev => {
        const updated = [...prev];
        // Attach feedback to the last user message
        if (data.feedback) {
          const lastUserIdx = updated.length - 1;
          updated[lastUserIdx] = { ...updated[lastUserIdx], feedback: data.feedback };
        }
        return [...updated, aiMsg];
      });
      setQuestionsAsked(data.questionsAsked || questionsAsked);

      if (data.status === 'completed') {
        setOverallFeedback(data.overallFeedback);
        setPhase('review');
        fetchHistory();
      }
    } catch (error) {
      console.error('Failed to send response', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleEnd = async () => {
    setSending(true);
    try {
      const { data } = await api.post(`/mock-interview/${interviewId}/end`);
      setOverallFeedback(data.overallFeedback);
      setPhase('review');
      fetchHistory();
    } catch (error) {
      console.error('Failed to end interview', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetInterview = () => {
    setPhase('setup');
    setMessages([]);
    setInterviewId(null);
    setOverallFeedback(null);
    setQuestionsAsked(0);
    setInputText('');
  };

  const loadPastInterview = async (id) => {
    try {
      const { data } = await api.get(`/mock-interview/${id}`);
      setInterviewId(data._id);
      setCompany(data.company);
      setRole(data.role);
      setInterviewType(data.interviewType);
      setMessages(data.messages || []);
      setQuestionsAsked(data.questionsAsked);
      if (data.status === 'completed') {
        setOverallFeedback(data.overallFeedback);
        setPhase('review');
      } else {
        setPhase('chat');
      }
    } catch (e) {
      console.error('Failed to load interview', e);
    }
  };

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div className="mock-interview-container">
        <motion.header className="mock-interview-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-gradient">🎙️ Mock Interview</h1>
          <p>AI-powered interview simulation with real-time feedback</p>
        </motion.header>

        <motion.div className="interview-setup glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2>Configure Your Interview</h2>

          <div className="setup-row">
            <div className="form-group">
              <label className="form-label">Company</label>
              <select className="form-input" value={company} onChange={e => setCompany(e.target.value)}>
                <option value="">Select company...</option>
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-input" placeholder="e.g. SDE-1, Frontend Dev" value={role} onChange={e => setRole(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Interview Type</label>
            <div className="interview-type-grid">
              {INTERVIEW_TYPES.map(t => (
                <div key={t.id} className={`type-card ${interviewType === t.id ? 'selected' : ''}`} onClick={() => setInterviewType(t.id)}>
                  <div className="type-icon">{t.icon}</div>
                  <div className="type-name">{t.name}</div>
                  <div className="type-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <select className="form-input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleStart} disabled={!company || !role || !interviewType || sending}>
            {sending ? 'Starting...' : '🚀 Start Interview'}
          </button>
        </motion.div>

        {/* Past Interview History */}
        {history.length > 0 && (
          <div className="interview-history">
            <h2>Recent Interviews</h2>
            <div className="history-grid">
              {history.map(iv => (
                <motion.div key={iv._id} className="history-card glass-panel" onClick={() => loadPastInterview(iv._id)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="history-card-left">
                    <span className="hc-company">{iv.company} — {iv.role}</span>
                    <span className="hc-meta">{iv.interviewType} · {iv.difficulty} · {new Date(iv.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="history-card-right">
                    {iv.overallFeedback?.totalScore != null && <div className="hc-score">{iv.overallFeedback.totalScore}/100</div>}
                    <span className={`hc-status ${iv.status}`}>{iv.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // CHAT / REVIEW PHASE
  return (
    <div className="mock-interview-container">
      <div className="chat-wrapper glass-panel">
        <div className="chat-top-bar">
          <div className="chat-info">
            <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={resetInterview}><ArrowLeft size={16} /></button>
            <span className="company-badge">{company}</span>
            <span className="type-badge">{interviewType}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="question-counter">Q{questionsAsked}/5</span>
            {phase === 'chat' && <button className="end-btn" onClick={handleEnd} disabled={sending}><StopCircle size={14} /> End</button>}
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <motion.div key={idx} className={`chat-bubble ${msg.role}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="bubble-label">{msg.role === 'ai' ? '🤖 Interviewer' : '👤 You'}</div>
              {msg.content}
              {msg.feedback && (
                <div className="answer-feedback" style={{ borderLeft: `3px solid ${msg.feedback.isCorrect === false ? '#f87171' : msg.feedback.isCorrect === true ? '#34d399' : 'var(--neon-purple)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div className="feedback-score">Score: {msg.feedback.score}/10</div>
                    {msg.feedback.isCorrect === true && (
                      <span style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '6px', background: 'rgba(52,211,153,0.15)', color: '#34d399', fontWeight: 600 }}>✅ Correct</span>
                    )}
                    {msg.feedback.isCorrect === false && (
                      <span style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '6px', background: 'rgba(248,113,113,0.15)', color: '#f87171', fontWeight: 600 }}>❌ Incorrect</span>
                    )}
                  </div>
                  {msg.feedback.isCorrect === false && msg.feedback.correctAnswer && (
                    <div style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem', marginBottom: '0.5rem', borderRadius: '8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#fca5a5' }}>
                      <strong>Correct Answer:</strong> {msg.feedback.correctAnswer}
                    </div>
                  )}
                  {msg.feedback.strengths?.length > 0 && (
                    <ul className="feedback-list strengths">
                      {msg.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  )}
                  {msg.feedback.improvements?.length > 0 && (
                    <ul className="feedback-list improvements">
                      {msg.feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          {sending && (
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Overall Feedback (Review Phase) */}
        {phase === 'review' && overallFeedback && (
          <div className="overall-feedback-card">
            <h3>📊 Interview Summary</h3>
            <div className="feedback-score-large">{overallFeedback.totalScore}/100</div>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span className="feedback-recommendation" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--neon-purple)' }}>
                {overallFeedback.recommendation || 'N/A'}
              </span>
            </div>
            {overallFeedback.summary && <p className="feedback-summary">{overallFeedback.summary}</p>}
            <div className="feedback-areas">
              <div className="feedback-area-col">
                <h4>💪 Strong Areas</h4>
                {(overallFeedback.strongAreas || []).map((a, i) => <span key={i} className="tag tag-success">{a}</span>)}
              </div>
              <div className="feedback-area-col">
                <h4>📈 Improve</h4>
                {(overallFeedback.improvementAreas || []).map((a, i) => <span key={i} className="tag tag-warning">{a}</span>)}
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={resetInterview}>
              Start New Interview
            </button>
          </div>
        )}

        {/* Chat Input (only in active chat) */}
        {phase === 'chat' && (
          <div className="chat-input-area">
            <textarea className="chat-textarea" placeholder="Type your answer... (Shift+Enter for new line)" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} rows={2} disabled={sending} />
            <button className="btn btn-primary send-btn" onClick={handleSend} disabled={!inputText.trim() || sending}>
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterview;
