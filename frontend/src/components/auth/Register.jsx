import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FiUserPlus, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);

    const result = await register(formData);
    
    if (result.success) {
      setSuccess('Registration successful! Please login.');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-logo">🏠</div>
        <h1 className="register-title">RentFlow</h1>
        <p className="register-subtitle">Create your account</p>
        
        {error && (
          <Alert variant="danger" className="register-alert mt-3">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="register-success mt-3">
            {success}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit} className="mt-4">
          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 14 }}>
              Username
            </Form.Label>
            <Form.Control
              type="text"
              name="username"
              placeholder="Choose a username"
              className="register-input"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 14 }}>
              Email
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Enter your email"
              className="register-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 14 }}>
              Password
            </Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Create a password"
              className="register-input"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 14 }}>
              Confirm Password
            </Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              className="register-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Button 
            type="submit" 
            className="register-btn-primary"
            disabled={loading}
          >
            <FiUserPlus size={18} style={{ marginRight: 10 }} />
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Form>

        <div className="register-divider">
          <span>or</span>
        </div>

        <Link to="/login">
          <Button className="register-btn-secondary">
            <FiLogIn size={18} style={{ marginRight: 10 }} />
            Already have an account? Sign In
          </Button>
        </Link>

        <p className="text-center mt-4" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Secure • Fast • Reliable
        </p>
      </div>
    </div>
  );
};

export default Register;