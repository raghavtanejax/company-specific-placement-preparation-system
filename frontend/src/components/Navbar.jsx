import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, Code } from 'lucide-react';
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
    { name: 'JD Analyzer', path: '/analyze', icon: <FileText size={18} /> },
    { name: 'Practice', path: '/quiz', icon: <Code size={18} /> },
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
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.icon}
              {link.name}
              {location.pathname === link.path && (
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
