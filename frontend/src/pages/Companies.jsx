import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { Building2, Search, ChevronRight, Users, BookOpen } from 'lucide-react';
import './Companies.css';

const difficultyColors = {
  easy: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
  medium: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: 'rgba(245, 158, 11, 0.3)' },
  hard: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
};

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await api.get('/companies');
        setCompanies(data);
      } catch (error) {
        console.error('Failed to load companies', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const filtered = companies.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || c.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  if (loading) return <div className="loading">Loading companies...</div>;

  return (
    <div className="companies-container">
      <header className="page-header">
        <h1 className="text-gradient">Company Explorer</h1>
        <p className="page-subtitle">Choose a target company and start practicing with curated questions and roadmaps.</p>
      </header>

      <div className="companies-filters glass-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {['all', 'easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              className={`filter-pill ${filterDifficulty === d ? 'active' : ''}`}
              onClick={() => setFilterDifficulty(d)}
            >
              {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="companies-grid">
        {filtered.map((company, index) => (
          <motion.div
            key={company._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={`/companies/${company.slug}`} className="company-card glass-panel">
              <div className="company-card-header">
                <span className="company-logo" style={{ backgroundColor: `${company.color}20` }}>
                  {company.logo}
                </span>
                <span
                  className="difficulty-badge"
                  style={{
                    background: difficultyColors[company.difficulty].bg,
                    color: difficultyColors[company.difficulty].color,
                    border: `1px solid ${difficultyColors[company.difficulty].border}`,
                  }}
                >
                  {company.difficulty}
                </span>
              </div>

              <h3 className="company-name">{company.name}</h3>
              <p className="company-desc">{company.description}</p>

              <div className="company-meta">
                <div className="meta-item">
                  <BookOpen size={14} />
                  <span>{company.questionCount} Questions</span>
                </div>
                <div className="meta-item">
                  <Users size={14} />
                  <span>{company.hiringPattern?.avgCTC || 'N/A'}</span>
                </div>
              </div>

              <div className="company-focus">
                {company.hiringPattern?.focusAreas?.slice(0, 3).map((area) => (
                  <span key={area} className="focus-tag">{area}</span>
                ))}
                {company.hiringPattern?.focusAreas?.length > 3 && (
                  <span className="focus-tag more-tag">+{company.hiringPattern.focusAreas.length - 3}</span>
                )}
              </div>

              <div className="company-card-footer">
                <span className="view-details">View Roadmap</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state glass-panel">
          <Building2 size={48} className="empty-icon" />
          <p>No companies match your search. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default Companies;
