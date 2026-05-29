import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Shield, Trash2, Trophy, Activity, CheckCircle, Save, Loader2, AlertTriangle, ChevronRight, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import SEO from '../components/SEO';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [performance, setPerformance] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [targetJobLocation, setTargetJobLocation] = useState('');
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
        setProfile({ 
          name: data.name, 
          email: data.email, 
          targetJobLocation: data.targetJobLocation || '' 
        });
        setName(data.name);
        setEmail(data.email);
        setTargetJobLocation(data.targetJobLocation || '');
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
      const { data } = await api.put('/user/profile', { name, email, targetJobLocation });
      setProfile({ 
        name: data.user.name, 
        email: data.user.email, 
        targetJobLocation: data.user.targetJobLocation || '' 
      });
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Dispatch custom event to sync with Navbar immediately
      window.dispatchEvent(new Event('user-profile-updated'));
      
      setProfileMessage({ type: 'success', text: 'Profile details updated successfully!' });
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

  const tabs = [
    { id: 'profile', label: 'Personal Information', icon: <User size={18} /> },
    { id: 'security', label: 'Security & Password', icon: <Shield size={18} /> },
    { id: 'stats', label: 'Preparation Stats', icon: <Trophy size={18} /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={18} />, danger: true }
  ];

  return (
    <div className="settings-container">
      <SEO title="Account Settings" noIndex />
      
      <header className="settings-header">
        <div className="settings-header-badge">Control Console</div>
        <h1 className="text-gradient">Account Settings</h1>
        <p>Manage your profile, secure your credentials, and review platform stats.</p>
      </header>

      <div className="settings-layout">
        {/* Settings Sidebar Tabs */}
        <aside className="settings-sidebar glass-panel">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Clear state notifications on switch
                setProfileMessage({ type: '', text: '' });
                setPasswordMessage({ type: '', text: '' });
                setShowDeleteConfirm(false);
              }}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.danger ? 'danger-tab' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="active-tab-indicator" 
                  className="active-tab-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <ChevronRight size={14} className="tab-chevron" />
            </button>
          ))}
        </aside>

        {/* Settings Tab Panels */}
        <main className="settings-content">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="settings-panel glass-panel"
              >
                <div className="panel-header">
                  <User size={22} color="var(--neon-purple)" />
                  <div>
                    <h2>Personal Information</h2>
                    <p>Update your personal details and contact email address.</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="panel-form">
                  {profileMessage.text && (
                    <div className={`form-message ${profileMessage.type}-message`}>
                      {profileMessage.text}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input 
                        type="text" 
                        className="form-input" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon" />
                      <input 
                        type="email" 
                        className="form-input" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        placeholder="yourname@example.com"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Job Location (Self-Reported)</label>
                    <div className="input-with-icon">
                      <MapPin size={18} className="input-icon" />
                      <input 
                        type="text" 
                        className="form-input" 
                        value={targetJobLocation} 
                        onChange={(e) => setTargetJobLocation(e.target.value)} 
                        placeholder="e.g. London, Remote, New Delhi"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                      {profileSaving ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={16} />
                          Saving changes...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="settings-panel glass-panel"
              >
                <div className="panel-header">
                  <Shield size={22} color="var(--neon-pink)" />
                  <div>
                    <h2>Security & Password</h2>
                    <p>Update your password to keep your placement account secure.</p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="panel-form">
                  {passwordMessage.text && (
                    <div className={`form-message ${passwordMessage.type}-message`}>
                      {passwordMessage.text}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input 
                        type="password" 
                        className="form-input" 
                        value={oldPassword} 
                        onChange={(e) => setOldPassword(e.target.value)} 
                        required={!!newPassword}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input 
                        type="password" 
                        className="form-input" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        minLength="6"
                        placeholder="•••••••• (Min 6 chars)"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input 
                        type="password" 
                        className="form-input" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        minLength="6"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
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
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="settings-panel glass-panel"
              >
                <div className="panel-header">
                  <Trophy size={22} color="var(--neon-blue)" />
                  <div>
                    <h2>Preparation Progress</h2>
                    <p>Summary of your overall performance and consistency statistics.</p>
                  </div>
                </div>

                {performance ? (
                  <div className="premium-stats-grid">
                    <div className="premium-stat-card">
                      <div className="p-stat-icon purple-glow"><Trophy size={24} /></div>
                      <div className="p-stat-info">
                        <h3>Total XP</h3>
                        <span className="p-stat-val text-gradient">{performance.xp || 0} XP</span>
                      </div>
                    </div>

                    <div className="premium-stat-card">
                      <div className="p-stat-icon pink-glow"><Activity size={24} /></div>
                      <div className="p-stat-info">
                        <h3>Daily Streak</h3>
                        <span className="p-stat-val text-gradient">{performance.currentStreak || 0} Days 🔥</span>
                      </div>
                    </div>

                    <div className="premium-stat-card">
                      <div className="p-stat-icon blue-glow"><CheckCircle size={24} /></div>
                      <div className="p-stat-info">
                        <h3>Quizzes Taken</h3>
                        <span className="p-stat-val text-gradient">{performance.totalQuizzesTaken || 0}</span>
                      </div>
                    </div>

                    <div className="premium-stat-card">
                      <div className="p-stat-icon gray-glow"><User size={24} /></div>
                      <div className="p-stat-info">
                        <h3>Questions Met</h3>
                        <span className="p-stat-val text-gradient">{performance.totalQuestionsAttempted || 0}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-stats-container">
                    <Trophy size={48} className="no-stats-icon" />
                    <p>No active stats found. Complete practice quizzes to see metrics here!</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'danger' && (
              <motion.div
                key="danger"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="settings-panel glass-panel danger-panel"
              >
                <div className="panel-header">
                  <AlertTriangle size={22} color="#EF4444" />
                  <div>
                    <h2>Danger Zone</h2>
                    <p>Irreversible actions for deleting your account and history.</p>
                  </div>
                </div>

                <div className="danger-panel-content">
                  <div className="danger-warning-card">
                    <AlertTriangle size={20} className="warning-card-icon" />
                    <div>
                      <h4>This action is irreversible</h4>
                      <p>
                        Deleting your account will immediately remove all your personal data, XP progress, 
                        bookmarks, interview histories, and custom analytics. There is no way to restore this data.
                      </p>
                    </div>
                  </div>

                  {deleteError && <div className="error-message mb-4">{deleteError}</div>}

                  {!showDeleteConfirm ? (
                    <button 
                      type="button" 
                      className="btn btn-danger delete-initiate-btn" 
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete My Account
                    </button>
                  ) : (
                    <div className="delete-confirm-box">
                      <p>Are you 100% sure? Please type your request to proceed.</p>
                      <div className="delete-confirm-actions">
                        <button 
                          type="button" 
                          className="btn btn-danger" 
                          onClick={handleDeleteAccount}
                          disabled={deleting}
                        >
                          {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Settings;
