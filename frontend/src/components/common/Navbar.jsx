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
  FiGrid,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiSettings,
  FiUserCheck,
  FiLogOut
} from 'react-icons/fi';
import './Navbar.css';

const NavigationBar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Get page icon based on current path
  const getPageIcon = () => {
    const path = location.pathname;
    
    if (path === '/' || path === '/dashboard') {
      return <FiHome className="page-icon icon-dashboard" />;
    }
    if (path === '/rooms') {
      return <FiGrid className="page-icon icon-rooms" />;
    }
    if (path === '/bills') {
      return <FiDollarSign className="page-icon icon-bills" />;
    }
    if (path === '/history') {
      return <FiClock className="page-icon icon-history" />;
    }
    if (path === '/all-tenants') {
      return <FiUserCheck className="page-icon icon-tenants" />;
    }
    if (path === '/settings') {
      return <FiSettings className="page-icon icon-settings" />;
    }
    return <FiHome className="page-icon icon-dashboard" />;
  };

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
          <FiMenu size={24} />
        </button>
        <h1 className="page-title">
          {getPageIcon()}
          <span>{getPageTitle()}</span>
        </h1>
      </div>

      <div className="navbar-right">
        <button className="lang-toggle" onClick={toggleLanguage} title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}>
          <FiGlobe size={18} className="lang-icon" />
          <span>{language === 'en' ? 'English' : 'हिंदी'}</span>
        </button>

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <FiSun size={22} className="sun-icon" /> : <FiMoon size={22} className="moon-icon" />}
        </button>

        <button className="notification-toggle" style={{ position: 'relative' }}>
          <FiBell size={22} className="bell-icon" />
          <span className="notification-dot" />
        </button>
      </div>
    </nav>
  );
};

export default NavigationBar;