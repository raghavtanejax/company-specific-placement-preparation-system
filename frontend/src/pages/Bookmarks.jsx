import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { Bookmark, Play, Trash2, Filter } from 'lucide-react';
import './Bookmarks.css';

const difficultyColors = {
  easy: '#34d399',
  medium: '#fcd34d',
  hard: '#f87171',
};

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSkill, setFilterSkill] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const { data } = await api.get('/user/bookmarks');
        setBookmarks(data);
      } catch (error) {
        console.error('Failed to load bookmarks', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  const removeBookmark = async (questionId) => {
    try {
      await api.post(`/user/bookmarks/${questionId}`);
      setBookmarks((prev) => prev.filter((b) => b._id !== questionId));
    } catch (error) {
      console.error('Failed to remove bookmark', error);
    }
  };

  // Get unique skills from all bookmarks
  const allSkills = [...new Set(bookmarks.flatMap((b) => b.skills || []))];

  const filtered = bookmarks.filter((b) => {
    const matchesSkill = filterSkill === 'all' || (b.skills && b.skills.includes(filterSkill));
    const matchesDiff = filterDifficulty === 'all' || b.difficulty === filterDifficulty;
    return matchesSkill && matchesDiff;
  });

  const handlePracticeBookmarked = () => {
    const ids = filtered.map((b) => b._id).join(',');
    navigate(`/quiz?bookmarks=true`);
  };

  if (loading) return <div className="loading">Loading bookmarks...</div>;

  return (
    <div className="bookmarks-container">
      <header className="page-header">
        <div className="header-row">
          <div>
            <h1 className="text-gradient">Your Bookmarks</h1>
            <p className="page-subtitle">{bookmarks.length} questions saved for later revision.</p>
          </div>
          {bookmarks.length > 0 && (
            <button className="btn btn-primary" onClick={handlePracticeBookmarked}>
              <Play size={16} /> Practice Bookmarked
            </button>
          )}
        </div>
      </header>

      {bookmarks.length > 0 && (
        <div className="bookmarks-filters glass-panel">
          <Filter size={16} className="filter-icon" />
          <select
            className="form-input filter-select"
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
          >
            <option value="all">All Skills</option>
            {allSkills.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="form-input filter-select"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      )}

      <div className="bookmarks-list">
        {filtered.length === 0 ? (
          <div className="empty-state glass-panel">
            <Bookmark size={48} className="empty-icon" />
            <p>{bookmarks.length === 0
              ? 'No bookmarks yet. Bookmark questions during quizzes to save them here!'
              : 'No bookmarks match your filters.'
            }</p>
          </div>
        ) : (
          filtered.map((q, idx) => (
            <motion.div
              key={q._id}
              className="bookmark-card glass-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <div className="bookmark-card-content">
                <div className="bookmark-card-header">
                  <span
                    className="bm-difficulty"
                    style={{
                      color: difficultyColors[q.difficulty],
                      background: `${difficultyColors[q.difficulty]}18`,
                    }}
                  >
                    {q.difficulty}
                  </span>
                  <span className="bm-type">{q.type === 'mcq' ? 'MCQ' : 'Coding'}</span>
                </div>
                <h3 className="bookmark-title">{q.title}</h3>
                <div className="bookmark-skills">
                  {q.skills?.map((s) => (
                    <span key={s} className="skill-chip">{s}</span>
                  ))}
                </div>
              </div>
              <button
                className="remove-btn"
                onClick={() => removeBookmark(q._id)}
                title="Remove bookmark"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
