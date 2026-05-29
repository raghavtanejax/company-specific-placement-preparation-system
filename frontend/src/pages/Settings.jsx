import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Shield, Trash2, Trophy, Activity, CheckCircle, Save, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import SEO from '../components/SEO';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [performance, setPerformance] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UX states
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Message states
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await api.get('/user/dashboard');
        setProfile({ name: data.name, email: data.email });
        setName(data.name);
        setEmail(data.email);
        setPerformance(data.performance);
      } catch (err) {
        console.error('Failed to load user settings data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage({ type: '', text: '' });
    try {
      const { data } = await api.put('/user/profile', { name, email });
      setProfile({ name: data.user.name, email: data.user.email });
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Dispatch custom event to sync with Navbar immediately
      window.dispatchEvent(new Event('user-profile-updated'));
      
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMessage({ type: '', text: '' });
    try {
      await api.put('/user/profile', { oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (err) {
      setPasswordMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete('/user/profile');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      // Force reload to clean any socket/in-memory states
      window.location.reload();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <Loader2 className="animate-spin" size={40} color="var(--neon-purple)" />
        <p>Loading your account settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <SEO title="Account Settings" noIndex />
      
      <header className="settings-header">
        <h1 className="text-gradient">Account Settings</h1>
        <p>Manage your profile, update password, and view platform statistics.</p>
      </header>

      <div className="settings-grid">
        {/* Profile Card */}
        <motion.div 
          className="settings-card glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header">
            <User size={20} color="var(--neon-purple)" />
            <h2>Personal Information</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile}>
            {profileMessage.text && (
              <div className={`form-message ${profileMessage.type}-message`}>
                {profileMessage.text}
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input 
                  type="text" 
                  className="form-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input 
                  type="email" 
                  className="form-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={profileSaving}>
              {profileSaving ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Security Card */}
        <motion.div 
          className="settings-card glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <Shield size={20} color="var(--neon-pink)" />
            <h2>Security & Password</h2>
          </div>

          <form onSubmit={handleChangePassword}>
            {passwordMessage.text && (
              <div className={`form-message ${passwordMessage.type}-message`}>
                {passwordMessage.text}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input 
                  type="password" 
                  className="form-input" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)} 
                  required={!!newPassword}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input 
                  type="password" 
                  className="form-input" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  minLength="6"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input 
                  type="password" 
                  className="form-input" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  minLength="6"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-secondary" disabled={passwordSaving}>
              {passwordSaving ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Updating...
                </>
              ) : (
                <>
                  <Shield size={16} className="mr-2" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Stats Card */}
        <motion.div 
          className="settings-card glass-panel stats-panel-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <Trophy size={20} color="var(--neon-blue)" />
            <h2>Preparation Progress</h2>
          </div>

          {performance ? (
            <div className="settings-stats-list">
              <div className="settings-stat-row">
                <div className="stat-label-with-icon">
                  <Trophy size={16} color="var(--neon-purple)" />
                  <span>Total XP Earned</span>
                </div>
                <span className="stat-value">{performance.xp || 0} XP</span>
              </div>

              <div className="settings-stat-row">
                <div className="stat-label-with-icon">
                  <Activity size={16} color="var(--neon-pink)" />
                  <span>Current Active Streak</span>
                </div>
                <span className="stat-value">{performance.currentStreak || 0} Days 🔥</span>
              </div>

              <div className="settings-stat-row">
                <div className="stat-label-with-icon">
                  <CheckCircle size={16} color="#10B981" />
                  <span>Quizzes Completed</span>
                </div>
                <span className="stat-value">{performance.totalQuizzesTaken || 0}</span>
              </div>

              <div className="settings-stat-row">
                <div className="stat-label-with-icon">
                  <User size={16} color="var(--text-muted)" />
                  <span>Questions Attempted</span>
                </div>
                <span className="stat-value">{performance.totalQuestionsAttempted || 0}</span>
              </div>
            </div>
          ) : (
            <p className="no-stats">Take a quiz or complete interviews to start earning stats!</p>
          )}
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          className="settings-card glass-panel danger-zone-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <AlertTriangle size={20} color="#EF4444" />
            <h2>Danger Zone</h2>
          </div>

          <p className="danger-description">
            Permanently delete your PrepAI account, including all your bookmarks, streaks, progress, and quiz history. This action is irreversible.
          </p>

          {deleteError && <div className="error-message mb-4">{deleteError}</div>}

          {!showDeleteConfirm ? (
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} className="mr-2" />
              Delete Account
            </button>
          ) : (
            <div className="delete-confirmation-box">
              <p className="confirmation-warning">Are you absolutely sure? This will delete all your records permanently.</p>
              <div className="confirmation-buttons">
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
