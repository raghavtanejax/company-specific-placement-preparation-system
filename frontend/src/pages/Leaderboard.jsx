import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Trophy, Flame, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get('/leaderboard?limit=50');
        setLeaderboard(data.leaderboard || []);
        setCurrentUserRank(data.currentUserRank);
      } catch (error) {
        console.error('Failed to load leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="loading">Loading leaderboard...</div>;

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const medalClasses = ['gold', 'silver', 'bronze'];
  const medals = ['🥇', '🥈', '🥉'];
  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="leaderboard-container">
      <motion.header
        className="leaderboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-gradient">🏆 Leaderboard</h1>
        <p>Top performers in the PrepAI community</p>
      </motion.header>

      {/* Podium for Top 3 */}
      {top3.length >= 3 && (
        <motion.div
          className="podium-section"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {podiumOrder.map((user, idx) => {
            const actualRank = user.rank - 1; // 0-indexed for medalClasses
            return (
              <div key={user._id} className={`podium-card glass-panel ${medalClasses[actualRank]}`}>
                <div className="podium-rank">{medals[actualRank]}</div>
                <div className="podium-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="podium-name">{user.name}</div>
                <div className="podium-xp">{user.xp.toLocaleString()} XP</div>
                <div className="podium-streak">🔥 {user.currentStreak} streak</div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Current User Rank */}
      {currentUserRank && (
        <motion.div
          className="user-rank-banner glass-panel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="rank-info">
            <Trophy size={24} color="var(--neon-purple)" />
            <div>
              <div className="rank-label">Your Rank</div>
              <div className="rank-label"><strong>#{currentUserRank}</strong> out of {leaderboard.length > 0 ? 'all users' : '...'}</div>
            </div>
          </div>
          <div className="rank-number">#{currentUserRank}</div>
        </motion.div>
      )}

      {/* Leaderboard Table */}
      {leaderboard.length > 0 ? (
        <motion.div
          className="leaderboard-table-wrapper glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>XP</th>
                <th>Accuracy</th>
                <th>Streak</th>
                <th>Quizzes</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <motion.tr
                  key={user._id}
                  className={user.isCurrentUser ? 'current-user' : ''}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * index }}
                >
                  <td className="rank-cell">
                    {user.rank <= 3 ? medals[user.rank - 1] : `#${user.rank}`}
                  </td>
                  <td>
                    <div className="name-cell">
                      <div className="table-avatar">{user.name.charAt(0).toUpperCase()}</div>
                      {user.name} {user.isCurrentUser && <span style={{ color: 'var(--neon-purple)', fontSize: '0.75rem' }}>(You)</span>}
                    </div>
                  </td>
                  <td className="xp-cell">{user.xp.toLocaleString()}</td>
                  <td className="accuracy-cell" style={{
                    color: user.accuracy >= 70 ? '#34d399' : user.accuracy >= 40 ? '#fcd34d' : '#f87171'
                  }}>
                    {user.accuracy}%
                  </td>
                  <td className="streak-cell">🔥 {user.currentStreak}</td>
                  <td>{user.totalQuizzes}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <div className="leaderboard-empty glass-panel">
          <div className="empty-icon">🏆</div>
          <p>No one on the leaderboard yet. Be the first to take a quiz!</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
