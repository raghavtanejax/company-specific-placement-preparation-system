import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, ArrowRight, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import './JDAnalysis.css';

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
    if (result && result.extractedSkills.length > 0) {
      const skillsQuery = result.extractedSkills.join(',');
      navigate(`/quiz?skills=${skillsQuery}`);
    } else {
      navigate('/quiz');
    }
  };

  return (
    <div className="analyze-container">
      <header className="page-header text-center">
        <h1 className="text-gradient">Analyze Job Description</h1>
        <p>Paste the JD below to extract required skills and generate a customized preparation plan.</p>
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
              {loading ? 'Analyzing...' : 'Analyze Requirements'}
            </button>
          </form>
          {error && <p className="error-message mt-4">{error}</p>}
        </div>

        {result && (
          <motion.div 
            className="result-section glass-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2>Analysis Results</h2>
            <div className="extracted-skills">
              <p className="skills-subtitle">We found the following critical skills required for this role:</p>
              {result.extractedSkills && result.extractedSkills.length > 0 ? (
                <div className="tags-container mb-6">
                  {result.extractedSkills.map(skill => (
                    <span key={skill} className="tag tag-success">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="empty-message mb-6">No specific technical skills identified from our dictionary. Try a more detailed JD.</p>
              )}
              
              <button onClick={handleStartPractice} className="btn btn-primary w-full pulse-btn">
                Start Tailored Practice <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default JDAnalysis;
