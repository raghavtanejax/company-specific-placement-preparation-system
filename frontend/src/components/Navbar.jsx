import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, Code, Building2, History, Bookmark, MessageSquare, Trophy, Mic, MessagesSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) return null; // Don't show navbar on login/register pages

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Companies', path: '/companies', icon: <Building2 size={18} /> },
    { name: 'JD Analyzer', path: '/analyze', icon: <FileText size={18} /> },
    { name: 'Practice', path: '/quiz', icon: <Code size={18} /> },
    { name: 'Mock Interview', path: '/mock-interview', icon: <Mic size={18} /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={18} /> },
    { name: 'Discussions', path: '/discussions', icon: <MessagesSquare size={18} /> },
    { name: 'History', path: '/history', icon: <History size={18} /> },
    { name: 'Bookmarks', path: '/bookmarks', icon: <Bookmark size={18} /> },
    { name: 'Experiences', path: '/experiences', icon: <MessageSquare size={18} /> },
  ];

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="text-gradient">PrepAI</span>
        </Link>
        
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`nav-link ${location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(link.path)) ? 'active' : ''}`}
            >
              {link.icon}
              <span className="nav-link-text">{link.name}</span>
              {(location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(link.path))) && (
                <motion.div layoutId="navbar-indicator" className="nav-indicator" />
              )}
            </Link>
          ))}
        </div>

        <button onClick={handleLogout} className="btn btn-secondary logout-btn">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
