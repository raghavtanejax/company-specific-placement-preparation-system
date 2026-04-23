import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { MessageSquare, ThumbsUp, ArrowLeft, Plus, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import './Discussions.css';

const Discussions = () => {
  const [view, setView] = useState('list'); // list | detail | new
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');

  // New discussion form
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newQuestionId, setNewQuestionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchDiscussions();
  }, [sort]);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/discussions?sort=${sort}&limit=30`);
      setDiscussions(data.discussions || []);
    } catch (error) {
      console.error('Failed to load discussions', error);
    } finally {
      setLoading(false);
    }
  };

  const openDiscussion = async (disc) => {
    // Reload with full replies populated
    try {
      const qId = disc.questionId?._id || disc.questionId;
      const { data } = await api.get(`/discussions/question/${qId}?limit=100`);
      const full = (data.discussions || []).find(d => d._id === disc._id);
      setSelectedDiscussion(full || disc);
      setView('detail');
    } catch (e) {
      setSelectedDiscussion(disc);
      setView('detail');
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setSubmitting(true);
    try {
      const payload = { title: newTitle, body: newBody };
      // If a questionId is provided, link it; otherwise use a general placeholder
      if (newQuestionId.trim()) {
        payload.questionId = newQuestionId.trim();
      } else {
        // For general discussions, we need a questionId. We'll use a placeholder approach.
        // The backend requires questionId, so we'll inform the user.
        alert('Please enter a Question ID to link this discussion to. You can find question IDs from the quiz page.');
        setSubmitting(false);
        return;
      }
      await api.post('/discussions', payload);
      setNewTitle('');
      setNewBody('');
      setNewQuestionId('');
      setView('list');
      fetchDiscussions();
    } catch (error) {
      console.error('Failed to create discussion', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (discussionId) => {
    try {
      const { data } = await api.post(`/discussions/${discussionId}/upvote`);
      // Update in list
      setDiscussions(prev => prev.map(d =>
        d._id === discussionId ? { ...d, upvotes: data.hasUpvoted ? [...(d.upvotes || []), 'me'] : (d.upvotes || []).slice(0, -1) } : d
      ));
      // Update in detail view
      if (selectedDiscussion?._id === discussionId) {
        setSelectedDiscussion(prev => ({
          ...prev,
          upvotes: data.hasUpvoted ? [...(prev.upvotes || []), 'me'] : (prev.upvotes || []).slice(0, -1),
        }));
      }
    } catch (e) {
      console.error('Upvote failed', e);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedDiscussion) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/discussions/${selectedDiscussion._id}/reply`, { body: replyText });
      setSelectedDiscussion(data);
      setReplyText('');
    } catch (e) {
      console.error('Reply failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyUpvote = async (replyId) => {
    if (!selectedDiscussion) return;
    try {
      await api.post(`/discussions/${selectedDiscussion._id}/reply/${replyId}/upvote`);
      // Refresh the discussion
      openDiscussion(selectedDiscussion);
    } catch (e) {
      console.error('Reply upvote failed', e);
    }
  };

  // DETAIL VIEW
  if (view === 'detail' && selectedDiscussion) {
    const d = selectedDiscussion;
    return (
      <div className="discussions-container">
        <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => { setView('list'); setSelectedDiscussion(null); }}>
          <ArrowLeft size={16} /> Back
        </button>

        <motion.div className="discussion-detail glass-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="dd-header">
            <h2>{d.title}</h2>
            <div className="dd-meta">
              <span>By <strong>{d.author?.name || 'Unknown'}</strong></span>
              <span>{new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {d.questionId?.title && <span className="dc-question-tag">📝 {d.questionId.title}</span>}
            </div>
          </div>

          <div className="dd-body">{d.body}</div>

          <div className="dd-actions">
            <button className={`upvote-btn ${(d.upvotes || []).length > 0 ? '' : ''}`} onClick={() => handleUpvote(d._id)}>
              <ThumbsUp size={16} /> {(d.upvotes || []).length}
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={14} /> {(d.replies || []).length} replies
            </span>
          </div>

          {/* Replies */}
          <div className="replies-section">
            <h3>Replies</h3>
            {(d.replies || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No replies yet. Be the first to respond!</p>
            ) : (
              (d.replies || []).map((reply, idx) => (
                <motion.div key={reply._id || idx} className="reply-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}>
                  <div className="reply-author">{reply.author?.name || 'User'}</div>
                  <div className="reply-body">{reply.body}</div>
                  <div className="reply-meta">
                    <span>{new Date(reply.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <button className="upvote-btn" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => handleReplyUpvote(reply._id)}>
                      <ThumbsUp size={12} /> {(reply.upvotes || []).length}
                    </button>
                  </div>
                </motion.div>
              ))
            )}

            <div className="reply-input-area">
              <textarea placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} />
              <button className="btn btn-primary" style={{ padding: '10px 16px' }} onClick={handleReply} disabled={!replyText.trim() || submitting}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // NEW DISCUSSION FORM
  if (view === 'new') {
    return (
      <div className="discussions-container">
        <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => setView('list')}>
          <ArrowLeft size={16} /> Back
        </button>

        <motion.div className="new-discussion-form glass-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Start a Discussion</h3>

          <div className="form-group">
            <label className="form-label">Question ID (from quiz)</label>
            <input className="form-input" placeholder="Paste question ID" value={newQuestionId} onChange={e => setNewQuestionId(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" placeholder="e.g. How to solve Two Sum optimally?" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Body</label>
            <textarea className="form-input" rows={6} placeholder="Describe your approach, doubt, or solution..." value={newBody} onChange={e => setNewBody(e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreate} disabled={!newTitle.trim() || !newBody.trim() || submitting}>
            {submitting ? 'Posting...' : 'Post Discussion'}
          </button>
        </motion.div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="discussions-container">
      <motion.header className="discussions-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-gradient">💬 Discussions</h1>
        <p>Community Q&A — share solutions, ask doubts, learn together</p>
      </motion.header>

      <div className="discussions-toolbar">
        <div className="sort-btns">
          <button className={`sort-btn ${sort === 'newest' ? 'active' : ''}`} onClick={() => setSort('newest')}>Newest</button>
          <button className={`sort-btn ${sort === 'popular' ? 'active' : ''}`} onClick={() => setSort('popular')}>Popular</button>
        </div>
        <button className="btn btn-primary" onClick={() => setView('new')}>
          <Plus size={16} /> New Discussion
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading discussions...</div>
      ) : discussions.length === 0 ? (
        <div className="empty-discussions glass-panel">
          <div className="empty-icon">💬</div>
          <p>No discussions yet. Start the conversation!</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setView('new')}>
            <Plus size={16} /> Start First Discussion
          </button>
        </div>
      ) : (
        <div className="discussion-list">
          {discussions.map((disc, idx) => (
            <motion.div key={disc._id} className="discussion-card glass-panel" onClick={() => openDiscussion(disc)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <div className="dc-top">
                <span className="dc-title">{disc.title}</span>
                {disc.questionId?.title && <span className="dc-question-tag">{disc.questionId.title}</span>}
              </div>
              <div className="dc-body">{disc.body}</div>
              <div className="dc-meta">
                <span className="dc-author">{disc.author?.name || 'User'}</span>
                <span>{new Date(disc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span className="dc-upvotes"><ThumbsUp size={12} /> {(disc.upvotes || []).length}</span>
                <span><MessageSquare size={12} /> {(disc.replies || []).length}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discussions;
