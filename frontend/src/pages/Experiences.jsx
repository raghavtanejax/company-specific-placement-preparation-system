import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, ThumbsUp, Search, Filter, ChevronRight, Building2 } from 'lucide-react';
import './Experiences.css';

const resultConfig = {
  selected: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', label: '✅ Selected' },
  rejected: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', label: '❌ Rejected' },
  pending: { color: '#fcd34d', bg: 'rgba(245, 158, 11, 0.15)', label: '⏳ Pending' },
};

const Experiences = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCompany, setSearchCompany] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const navigate = useNavigate();

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchCompany) params.set('company', searchCompany);
      if (filterResult !== 'all') params.set('result', filterResult);
      const { data } = await api.get(`/experiences?${params.toString()}`);
      setExperiences(data.experiences);
    } catch (error) {
      console.error('Failed to load experiences', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [filterResult]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchExperiences();
  };

  return (
    <div className="experiences-container">
      <header className="page-header">
        <div className="header-row">
          <div>
            <h1 className="text-gradient">Interview Experiences</h1>
            <p className="page-subtitle">Learn from real interview experiences shared by the community.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/experiences/new')}>
            <Plus size={16} /> Share Your Experience
          </button>
        </div>
      </header>

      <div className="exp-filters glass-panel">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by company..."
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
        <div className="filter-pills">
          {['all', 'selected', 'rejected', 'pending'].map((r) => (
            <button
              key={r}
              className={`filter-pill ${filterResult === r ? 'active' : ''}`}
              onClick={() => setFilterResult(r)}
            >
              {r === 'all' ? 'All' : resultConfig[r]?.label || r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading experiences...</div>
      ) : experiences.length === 0 ? (
        <div className="empty-state glass-panel">
          <MessageSquare size={48} className="empty-icon" />
          <p>No experiences found. Be the first to share your interview experience!</p>
        </div>
      ) : (
        <div className="experiences-grid">
          {experiences.map((exp, idx) => {
            const rc = resultConfig[exp.result] || resultConfig.pending;
            return (
              <motion.div
                key={exp._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link to={`/experiences/${exp._id}`} className="exp-card glass-panel">
                  <div className="exp-card-top">
                    <div className="exp-company-info">
                      <Building2 size={18} />
                      <span className="exp-company">{exp.company}</span>
                    </div>
                    <span className="exp-result" style={{ color: rc.color, background: rc.bg }}>
                      {rc.label}
                    </span>
                  </div>

                  <h3 className="exp-role">{exp.role}</h3>

                  <div className="exp-meta">
                    <span className="exp-rounds">{exp.rounds?.length || 0} rounds</span>
                    <span className="exp-difficulty">{exp.difficulty}</span>
                  </div>

                  <p className="exp-preview">
                    {exp.overallTips
                      ? exp.overallTips.substring(0, 120) + (exp.overallTips.length > 120 ? '...' : '')
                      : 'No overall tips provided.'}
                  </p>

                  <div className="exp-card-footer">
                    <div className="exp-author">
                      <span className="author-avatar">{exp.author?.name?.[0] || 'U'}</span>
                      <span className="author-name">{exp.author?.name || 'Anonymous'}</span>
                    </div>
                    <div className="exp-stats">
                      <span className="upvote-count">
                        <ThumbsUp size={14} /> {exp.upvotes?.length || 0}
                      </span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Experiences;
