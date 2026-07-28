import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiMenu, 
  FiSun, 
  FiMoon, 
  FiBell, 
  FiGlobe,
  FiHome
} from 'react-icons/fi';
import './Navbar.css';

const NavigationBar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Check if current page is Dashboard
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    alert(`Language switched to ${newLang === 'en' ? 'English' : 'हिंदी'}`);
  };

  return (
    <div className="topbar">
      <div className="d-flex align-items-center gap-3">
        {/* Mobile Menu Button - Always Visible */}
        <button 
          className="d-block d-lg-none theme-toggle"
          onClick={toggleSidebar}
        >
          <FiMenu size={24} />
        </button>
        
        {/* Header - Sirf Dashboard page pe dikhega */}
        {isDashboard && (
          <div className="page-title">
            <h1>
              <FiHome size={24} className="dashboard-icon" />
              Dashboard
            </h1>
          </div>
        )}
      </div>

      {/* Actions - Sirf Dashboard page pe dikhenge */}
      {isDashboard && (
        <div className="topbar-actions">
          <button className="lang-toggle" onClick={toggleLanguage}>
            <FiGlobe size={18} style={{ color: '#6C63FF' }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              {language === 'en' ? 'English' : 'हिंदी'}
            </span>
          </button>

          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <FiSun size={22} style={{ color: '#FBBF24' }} />
            ) : (
              <FiMoon size={22} style={{ color: '#6C63FF' }} />
            )}
          </button>

          <button className="theme-toggle" style={{ position: 'relative' }}>
            <FiBell size={22} style={{ color: '#FF6B8A' }} />
            <span style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 10,
              height: 10,
              background: '#FF6B8A',
              borderRadius: '50%',
              border: '2px solid var(--bg-primary)',
            }} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NavigationBar;