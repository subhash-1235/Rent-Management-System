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
  FiUserCheck,
  FiFileText,
  FiCreditCard,
  FiUser
} from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { logout, role } = useAuth();
  const navigate = useNavigate();

  // ========================================
  // ADMIN NAVIGATION ITEMS
  // ========================================
  const adminNavItems = [
    { path: '/', icon: <MdDashboard size={20} className="icon dashboard" />, label: 'Dashboard' },
    { path: '/rooms', icon: <FiGrid size={20} className="icon rooms" />, label: 'Rooms & Tenants' },
    { path: '/bills', icon: <FiDollarSign size={20} className="icon bills" />, label: 'Bills & Rent' },
    { path: '/history', icon: <FiClock size={20} className="icon history" />, label: 'History' },
    { path: '/all-tenants', icon: <FiUserCheck size={20} className="icon tenants" />, label: 'All Tenants' },
    { path: '/settings', icon: <FiSettings size={20} className="icon settings" />, label: 'Settings' },
  ];

  // ========================================
  // TENANT NAVIGATION ITEMS
  // ========================================
  const tenantNavItems = [
    { path: '/tenant-dashboard', icon: <MdDashboard size={20} className="icon dashboard" />, label: 'Dashboard' },
    { path: '/tenant-bills', icon: <FiFileText size={20} className="icon bills" />, label: 'My Bills' },
    { path: '/tenant-payment', icon: <FiCreditCard size={20} className="icon payment" />, label: 'Pay Bill' },
    { path: '/tenant-profile', icon: <FiUser size={20} className="icon profile" />, label: 'My Profile' },
  ];

  // Select nav items based on role
  const navItems = role === 'admin' ? adminNavItems : tenantNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo-icon">🏠</div>
          <div>
            <div className="brand-text">RentFlow</div>
            <div className="brand-sub">{role === 'admin' ? 'Admin Panel' : 'Tenant Panel'}</div>
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