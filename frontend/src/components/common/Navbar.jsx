import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiMenu, 
  FiSun, 
  FiMoon, 
  FiBell, 
  FiGlobe,
  FiHome,
  FiLogOut,
  FiUser
} from 'react-icons/fi';
import './Navbar.css';

const NavigationBar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Get page title based on current path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path === '/rooms') return 'Rooms & Tenants';
    if (path === '/bills') return 'Bills & Rent';
    if (path === '/history') return 'History';
    if (path === '/all-tenants') return 'All Tenants';
    if (path === '/settings') return 'Settings';
    return 'Dashboard';
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar-top">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={toggleSidebar}>
          <FiMenu size={20} />
        </button>
        <h1 className="page-title">
          <FiHome size={20} className="page-icon" />
          {getPageTitle()}
        </h1>
      </div>

      <div className="navbar-right">
        <button className="lang-toggle" onClick={toggleLanguage} title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}>
          <FiGlobe size={16} />
          <span>{language === 'en' ? 'English' : 'हिंदी'}</span>
        </button>

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        <button className="theme-toggle" style={{ position: 'relative' }}>
          <FiBell size={20} />
          <span className="notification-dot" />
        </button>

        <div className="navbar-user" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="user-avatar">
            <FiUser size={16} />
          </div>
          <span className="user-name">Admin</span>
          <span className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>▼</span>
        </div>

        {showDropdown && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={handleLogout}>
              <FiLogOut size={16} />
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;