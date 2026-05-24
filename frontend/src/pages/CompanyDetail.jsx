import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, BookOpen, Target, Clock, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import './CompanyDetail.css';

const difficultyConfig = {
  easy: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
  medium: { color: '#fcd34d', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  hard: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' },
};

const CompanyDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { data } = await api.get(`/companies/${slug}`);
        setCompany(data);
      } catch (error) {
        console.error('Failed to load company', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [slug]);

  if (loading) return <div className="loading">Loading company details...</div>;
  if (!company) return <div className="loading">Company not found.</div>;

  const dc = difficultyConfig[company.difficulty] || difficultyConfig.medium;

  /*
   * Build optimised SEO strings from live company data.
   * These are rendered at runtime (CSR), so they rely on the JS engine
   * to execute before meta tags are visible. For true bot-indexable SSR,
   * see the Next.js generateMetadata() blueprint in the migration guide.
   */
  const seoTitle = `${company.name} Interview Questions & Hiring Process`;
  const seoDesc = `Prepare for ${company.name} placements with ${company.questionCount || 0}+ curated questions (${company.questionsByDifficulty?.easy || 0} easy, ${company.questionsByDifficulty?.medium || 0} medium, ${company.questionsByDifficulty?.hard || 0} hard). Study the ${company.difficulty}-level hiring roadmap, focus areas, and CTC details on PrepAI.`;

  /* JSON-LD structured data — helps Google display rich results */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: company.name,
    description: company.description,
    url: `https://prepai.in/companies/${company.slug}`,
    educationalCredentialAwarded: company.hiringPattern?.avgCTC || '',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${company.name} Interview Question Bank`,
      numberOfItems: company.questionCount || 0,
    },
  };

  return (
    <div className="company-detail-container">
      {/*
        Stage 1: Dynamic company-level SEO
        ───────────────────────────────────
        <SEO /> renders a <Helmet> block that overrides the site-level
        defaults defined in App.jsx for this route only.
      */}
      <SEO
        title={seoTitle}
        description={seoDesc}
        canonical={`/companies/${company.slug}`}
        ogType="website"
        ogImageAlt={`${company.name} interview preparation on PrepAI`}
      >
        {/* Inject JSON-LD as a raw <script> tag inside the <Helmet> slot */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </SEO>

      <button className="back-btn" onClick={() => navigate('/companies')}>
        <ArrowLeft size={18} /> Back to Companies
      </button>

      <motion.div
        className="company-hero glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="hero-top">
          <span className="hero-logo" style={{ backgroundColor: `${company.color}20` }}>
            {company.logo}
          </span>
          <div className="hero-info">
            <h1 className="hero-name">{company.name}</h1>
            <div className="hero-badges">
              <span
                className="difficulty-badge"
                style={{ background: dc.bg, color: dc.color, border: `1px solid ${dc.border}` }}
              >
                {company.difficulty} difficulty
              </span>
              {company.hiringPattern?.avgCTC && (
                <span className="ctc-badge">💰 {company.hiringPattern.avgCTC}</span>
              )}
            </div>
          </div>
        </div>
        <p className="hero-desc">{company.description}</p>
      </motion.div>

      {/* Hiring Process Roadmap */}
      <motion.div
        className="section glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="section-title">
          <Target size={20} /> Hiring Process Roadmap
        </h2>
        <div className="roadmap">
          {company.hiringPattern?.rounds?.map((round, i) => (
            <div key={i} className="roadmap-step">
              <div className="step-number" style={{ background: company.color }}>{i + 1}</div>
              <div className="step-content">
                <span className="step-label">{round}</span>
              </div>
              {i < company.hiringPattern.rounds.length - 1 && (
                <div className="step-connector"></div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Focus Areas & Question Stats */}
      <div className="detail-grid">
        <motion.div
          className="section glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="section-title">
            <BookOpen size={20} /> Focus Areas
          </h2>
          <div className="focus-areas-list">
            {company.hiringPattern?.focusAreas?.map((area) => (
              <span key={area} className="focus-area-chip">{area}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="section glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="section-title">
            <BookOpen size={20} /> Question Bank
          </h2>
          <div className="question-stats">
            <div className="q-stat">
              <span className="q-stat-count" style={{ color: '#34d399' }}>
                {company.questionsByDifficulty?.easy || 0}
              </span>
              <span className="q-stat-label">Easy</span>
            </div>
            <div className="q-stat">
              <span className="q-stat-count" style={{ color: '#fcd34d' }}>
                {company.questionsByDifficulty?.medium || 0}
              </span>
              <span className="q-stat-label">Medium</span>
            </div>
            <div className="q-stat">
              <span className="q-stat-count" style={{ color: '#f87171' }}>
                {company.questionsByDifficulty?.hard || 0}
              </span>
              <span className="q-stat-label">Hard</span>
            </div>
            <div className="q-stat total">
              <span className="q-stat-count">{company.questionCount || 0}</span>
              <span className="q-stat-label">Total</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Start Practice CTA */}
      <motion.div
        className="cta-section glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="cta-content">
          <h2>Ready to Practice?</h2>
          <p>Start solving {company.name}-specific questions to prepare for their interview process.</p>
        </div>
        <div className="cta-actions">
          <button
            className="btn btn-primary cta-btn"
            onClick={() => navigate(`/quiz?company=${company.slug}`)}
          >
            <Play size={18} /> Start Practice <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CompanyDetail;
