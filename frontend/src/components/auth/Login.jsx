import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FiUserPlus, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid username or password');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🏠</div>
        <h1 className="login-title">RentFlow</h1>
        <p className="login-subtitle">Sign in to your account</p>
        
        {error && (
          <Alert variant="danger" className="login-alert mt-3">
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit} className="mt-4">
          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 14 }}>
              Username
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your username"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 14 }}>
              Password
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button 
            type="submit" 
            className="login-btn-primary"
            disabled={loading}
          >
            <FiLogIn size={18} style={{ marginRight: 10 }} />
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <Link to="/register">
          <Button className="login-btn-secondary">
            <FiUserPlus size={18} style={{ marginRight: 10 }} />
            Create New Account
          </Button>
        </Link>

        <p className="text-center mt-4" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Secure • Fast • Reliable
        </p>
      </div>
    </div>
  );
};

export default Login;