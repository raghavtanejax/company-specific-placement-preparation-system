import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, Code, Building2, History, Bookmark, MessageSquare, Trophy, Mic, MessagesSquare, Activity, Users, Menu, X, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) return null;

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        setUser(JSON.parse(localStorage.getItem('user')));
      } catch (e) {
        setUser(null);
      }
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, []);

  // All navigation links
  const allNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, priority: true },
    { name: 'Companies', path: '/companies', icon: <Building2 size={18} />, priority: false },
    { name: 'JD Analyzer', path: '/analyze', icon: <FileText size={18} />, priority: false },
    { name: 'Practice', path: '/quiz', icon: <Code size={18} />, priority: true },
    { name: 'Mock Interview', path: '/mock-interview', icon: <Mic size={18} />, priority: true },
    { name: 'Peer Interview', path: '/peer-interview', icon: <Users size={18} />, priority: true },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={18} />, priority: false },
    { name: 'Discussions', path: '/discussions', icon: <MessagesSquare size={18} />, priority: false },
    { name: 'History', path: '/history', icon: <History size={18} />, priority: false },
    { name: 'Bookmarks', path: '/bookmarks', icon: <Bookmark size={18} />, priority: false },
    { name: 'Experiences', path: '/experiences', icon: <MessageSquare size={18} />, priority: false },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} />, priority: false },
  ];

  if (user && user.role === 'admin') {
    allNavLinks.push({ name: 'Admin', path: '/admin', icon: <Activity size={18} />, priority: false });
  }

  const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <>
      <nav className="navbar glass-panel">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <span className="text-gradient">PrepAI</span>
          </Link>
          
          {/* Desktop: show all links */}
          <div className="navbar-links desktop-links">
            {allNavLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.icon}
                <span className="nav-link-text">{link.name}</span>
                {isActive(link.path) && (
                  <motion.div layoutId="navbar-indicator" className="nav-indicator" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile: show only priority links */}
          <div className="navbar-links mobile-links">
            {allNavLinks.filter(l => l.priority).map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.icon}
                {isActive(link.path) && (
                  <motion.div layoutId="navbar-indicator-mobile" className="nav-indicator" />
                )}
              </Link>
            ))}
          </div>

          <div className="navbar-right">
            <button onClick={handleLogout} className="btn btn-secondary logout-btn desktop-logout">
              <LogOut size={18} />
              <span className="logout-text">Logout</span>
            </button>
            {/* Mobile hamburger */}
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Drawer for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside 
              className="sidebar-drawer glass-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="sidebar-header">
                <span className="text-gradient sidebar-title">PrepAI</span>
                <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
                  <X size={22} />
                </button>
              </div>

              <div className="sidebar-links">
                {allNavLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`sidebar-link ${isActive(link.path) ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                ))}
              </div>

              <div className="sidebar-footer">
                {user && (
                  <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="sidebar-user-name">{user.name || 'User'}</span>
                  </div>
                )}
                <button onClick={() => { handleLogout(); setSidebarOpen(false); }} className="btn btn-danger sidebar-logout">
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
