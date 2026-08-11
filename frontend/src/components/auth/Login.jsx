// frontend/src/components/auth/Login.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiUserPlus, 
  FiLogIn, 
  FiAlertCircle, 
  FiUser, 
  FiLock, 
  FiEye, 
  FiEyeOff
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState('dark');
  
  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    setUsername('');
    setPassword('');
    
    if (usernameInputRef.current) {
      usernameInputRef.current.value = '';
    }
    if (passwordInputRef.current) {
      passwordInputRef.current.value = '';
    }
    
    setTimeout(() => {
      if (usernameInputRef.current) {
        usernameInputRef.current.value = '';
        usernameInputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (passwordInputRef.current) {
        passwordInputRef.current.value = '';
        passwordInputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username/mobile and password');
      setLoading(false);
      return;
    }

    const result = await login(username.trim(), password.trim());
    
    if (result.success) {
      if (result.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/tenant-dashboard');
      }
    } else if (result.needsRegister) {
      // Only redirect to register if it's a mobile number (tenant)
      const isMobile = /^[0-9]{10}$/.test(username.trim());
      if (isMobile) {
        navigate('/tenant-register', { state: { mobile: username.trim() } });
      } else {
        setError('Account not found. Please check your credentials.');
      }
    } else {
      setError(result.error || 'Invalid credentials');
    }
    
    setLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="floating-circle c1"></div>
      <div className="floating-circle c2"></div>
      <div className="floating-circle c3"></div>

      <div className="login-card">
        <div className="login-logo">🏠</div>
        <h1 className="login-title">
          <span className="highlight">Rent</span>Flow
        </h1>
        <p className="login-subtitle">Login to your account</p>
        
        {error && (
          <Alert variant="danger" className="login-alert">
            <FiAlertCircle size={16} />
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit} className="mt-3" autoComplete="off">
          <Form.Group className="mb-3">
            <Form.Label>Username / Mobile Number</Form.Label>
            <div className="login-input-group">
              <FiUser className="login-input-icon" />
              <Form.Control
                ref={usernameInputRef}
                type="text"
                placeholder="Enter your username or mobile number"
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="off"
              />
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              Enter username (Admin) or 10-digit mobile number (Tenant)
            </small>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <div className="login-input-group">
              <FiLock className="login-input-icon" />
              <Form.Control
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                tabIndex="-1"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </Form.Group>

          <Button 
            type="submit" 
            className="login-btn-primary"
            disabled={loading}
          >
            <FiLogIn size={18} />
            {loading ? 'Please wait...' : 'Login'}
          </Button>
        </Form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <Link to="/register" className="login-register-link">
          <button className="login-btn-register">
            <FiUserPlus size={18} />
            Create New Account
          </button>
        </Link>

        <div className="login-footer-features">
          <span className="feature-item">
            <span className="feature-icon">🔒</span>
            Secure
          </span>
          <span className="feature-dot">•</span>
          <span className="feature-item">
            <span className="feature-icon">⚡</span>
            Fast
          </span>
          <span className="feature-dot">•</span>
          <span className="feature-item">
            <span className="feature-icon">🌟</span>
            Reliable
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;