import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, Building2, Calendar, Award } from 'lucide-react';

const resultConfig = {
  selected: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', label: '✅ Selected' },
  rejected: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', label: '❌ Rejected' },
  pending: { color: '#fcd34d', bg: 'rgba(245, 158, 11, 0.15)', label: '⏳ Pending' },
};

const ExperienceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/experiences/${id}`);
        setExperience(data);
        setUpvoteCount(data.upvotes?.length || 0);
        // Check if current user has upvoted
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id && data.upvotes?.includes(user.id)) {
          setHasUpvoted(true);
        }
      } catch (error) {
        console.error('Failed to load experience', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleUpvote = async () => {
    try {
      const { data } = await api.post(`/experiences/${id}/upvote`);
      setUpvoteCount(data.upvotes);
      setHasUpvoted(data.hasUpvoted);
    } catch (error) {
      console.error('Failed to toggle upvote', error);
    }
  };

  if (loading) return <div className="loading">Loading experience...</div>;
  if (!experience) return <div className="loading">Experience not found.</div>;

  const rc = resultConfig[experience.result] || resultConfig.pending;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: '2rem' }}>
      <button className="back-btn" onClick={() => navigate('/experiences')}>
        <ArrowLeft size={18} /> Back to Experiences
      </button>

      <motion.div
        className="glass-panel"
        style={{ padding: '2rem', marginBottom: '1.5rem' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <Building2 size={18} />
              <span style={{ fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>{experience.company}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{experience.role}</h1>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, color: rc.color, background: rc.bg }}>
                {rc.label}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {experience.difficulty} difficulty
              </span>
            </div>
          </div>

          <button
            onClick={handleUpvote}
            className={`btn ${hasUpvoted ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ThumbsUp size={16} /> {upvoteCount} {upvoteCount === 1 ? 'Upvote' : 'Upvotes'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>
              {experience.author?.name?.[0] || 'U'}
            </span>
            <span>{experience.author?.name || 'Anonymous'}</span>
          </div>
          <span>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            {new Date(experience.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </motion.div>

      {/* Interview Rounds */}
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Award size={20} /> Interview Rounds ({experience.rounds?.length || 0})
      </h2>

      {experience.rounds?.map((round, i) => (
        <motion.div
          key={i}
          className="glass-panel"
          style={{ padding: '1.5rem', marginBottom: '1rem' }}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'white', flexShrink: 0 }}>
              {i + 1}
            </div>
            <h3 style={{ fontSize: '1.05rem' }}>{round.name}</h3>
          </div>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem', fontSize: '0.9rem' }}>
            {round.description}
          </p>

          {round.questionsAsked?.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--neon-purple)', display: 'block', marginBottom: '0.5rem' }}>
                Questions Asked
              </span>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {round.questionsAsked.map((q, j) => (
                  <li key={j} style={{ fontSize: '0.85rem', color: 'var(--text-main)', paddingLeft: '1rem', borderLeft: '2px solid rgba(139,92,246,0.3)' }}>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {round.tips && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#34d399', display: 'block', marginBottom: '4px' }}>
                💡 Tips
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{round.tips}</p>
            </div>
          )}
        </motion.div>
      ))}

      {/* Overall Tips */}
      {experience.overallTips && (
        <motion.div
          className="glass-panel"
          style={{ padding: '1.5rem', borderColor: 'rgba(139,92,246,0.2)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>📝 Overall Tips & Advice</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.9rem' }}>
            {experience.overallTips}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ExperienceDetail;
