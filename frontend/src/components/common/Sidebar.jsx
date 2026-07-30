import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiGrid, 
  FiDollarSign, 
  FiUsers, 
  FiClock, 
  FiSettings,
  FiLogOut,
  FiUserCheck
} from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: <MdDashboard size={20} className="icon dashboard" />, label: 'Dashboard' },
    { path: '/rooms', icon: <FiGrid size={20} className="icon rooms" />, label: 'Rooms & Tenants' },
    { path: '/bills', icon: <FiDollarSign size={20} className="icon bills" />, label: 'Bills & Rent' },
    { path: '/history', icon: <FiClock size={20} className="icon history" />, label: 'History' },
    { path: '/all-tenants', icon: <FiUserCheck size={20} className="icon tenants" />, label: 'All Tenants' },
    { path: '/settings', icon: <FiSettings size={20} className="icon settings" />, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div 
          className="d-block d-lg-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.7)',
            zIndex: 999,
            backdropFilter: 'blur(4px)',
          }}
          onClick={toggleSidebar}
        />
      )}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo-icon">🏠</div>
          <div>
            <div className="brand-text">RentFlow</div>
            <div className="brand-sub">Premium Management</div>
          </div>
        </div>

        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => {
                  if (window.innerWidth < 992) toggleSidebar();
                }}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar">A</div>
            <div className="user-info">
              <div className="name">Admin</div>
              <div className="email">admin@rentflow.com</div>
            </div>
          </div>
          
          <button className="btn-logout-sidebar" onClick={handleLogout}>
            <FiLogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;