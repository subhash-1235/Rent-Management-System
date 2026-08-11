// frontend/src/components/auth/Register.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiUserPlus, 
  FiLogIn, 
  FiAlertCircle, 
  FiUser, 
  FiMail, 
  FiSmartphone, 
  FiLock, 
  FiEye, 
  FiEyeOff,
  FiCheckCircle,
  FiRefreshCw,
  FiArrowRight
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { otpAPI, tenantAPI } from '../../services/api';
import './Register.css';

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const preFilledMobile = location.state?.mobile || '';
  const isTenant = !!preFilledMobile;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: preFilledMobile || '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailForOTP, setEmailForOTP] = useState('');
  const [tenantRoomData, setTenantRoomData] = useState(null);
  
  const inputRefs = useRef([]);
  const { register } = useAuth();

  useEffect(() => {
    if (preFilledMobile && isTenant) {
      fetchTenantDetails(preFilledMobile);
    }
  }, [preFilledMobile]);

  const fetchTenantDetails = async (mobile) => {
    try {
      const response = await tenantAPI.checkMobile(mobile);
      if (response.data.exists) {
        setTenantRoomData(response.data);
        const fullName = response.data.name || '';
        const nameParts = fullName.split(' ');
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: response.data.email || '',
          mobile: mobile,
        }));
      }
    } catch (err) {
      console.error('Error fetching tenant details:', err);
    }
  };

  useEffect(() => {
    if (step === 2 && otpSent) {
      startTimer();
    }
  }, [step, otpSent]);

  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    const mobileRegex = /^[0-9]{10}$/;
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!mobileRegex.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!isTenant) {
        const checkResponse = await otpAPI.checkEmail(formData.email);
        if (checkResponse.data.exists) {
          setError('This email is already registered. Please use a different email.');
          setLoading(false);
          return;
        }
      }

      const otpResponse = await otpAPI.sendOTP(formData.email);

      if (otpResponse.status === 200) {
        setEmailForOTP(formData.email);
        setOtpSent(true);
        setStep(2);
        setSuccess('OTP sent to your email successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(otpResponse.data?.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    if (e.key === 'Enter') {
      handleVerifyOTP();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      
      const lastIndex = Math.min(digits.length - 1, 5);
      if (lastIndex < 5) {
        inputRefs.current[lastIndex + 1].focus();
      }
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setOtpError('Please enter complete 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const verifyResponse = await otpAPI.verifyOTP(emailForOTP, otpString);

      if (verifyResponse.status === 200) {
        setOtpSuccess('OTP verified successfully! Creating account...');
        await createAccount();
      } else {
        setOtpError(verifyResponse.data?.error || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setOtpError(err.response?.data?.error || 'Failed to verify OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const createAccount = async () => {
    try {
      let result;
      
      if (isTenant) {
        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
        result = await register({
          mobile: formData.mobile,
          name: fullName,
          email: formData.email,
          password: formData.password,
          otp: otp.join('')
        });
      } else {
        result = await register({
          email: formData.email,
          password: formData.password,
        });
      }
      
      if (result.success) {
        setOtpSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setOtpError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Create account error:', err);
      setOtpError('Something went wrong. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setOtpLoading(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const response = await otpAPI.resendOTP(emailForOTP);

      if (response.status === 200) {
        setOtpSuccess('New OTP sent to your email!');
        startTimer();
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
        setTimeout(() => setOtpSuccess(''), 3000);
      } else {
        setOtpError(response.data?.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setOtpError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const goBackToRegister = () => {
    setStep(1);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setOtpSuccess('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const renderRegistrationForm = () => (
    <>
      <div className="register-role-info">
        <span className="register-role-badge">
          {isTenant ? '👤 Tenant Registration' : '👨‍💼 Admin Registration'}
        </span>
        {isTenant && tenantRoomData && (
          <span className="register-room-info">
            Room: {tenantRoomData.room_number} • ₹{tenantRoomData.room_rent}/month
          </span>
        )}
      </div>

      <Form onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }}>
        <Row className="g-2">
          <Col xs={12} sm={6}>
            <div className="register-input-group">
              <FiUser className="register-input-icon" />
              <Form.Control
                type="text"
                name="firstName"
                placeholder="First Name"
                className={`register-input ${errors.firstName ? 'is-invalid' : ''}`}
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            {errors.firstName && (
              <div className="register-error">{errors.firstName}</div>
            )}
          </Col>
          <Col xs={12} sm={6}>
            <div className="register-input-group">
              <FiUser className="register-input-icon" />
              <Form.Control
                type="text"
                name="lastName"
                placeholder="Last Name"
                className={`register-input ${errors.lastName ? 'is-invalid' : ''}`}
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            {errors.lastName && (
              <div className="register-error">{errors.lastName}</div>
            )}
          </Col>
        </Row>

        <Row className="g-2 mt-2">
          <Col xs={12} sm={6}>
            <div className="register-input-group">
              <FiMail className="register-input-icon" />
              <Form.Control
                type="email"
                name="email"
                placeholder="Email Address"
                className={`register-input ${errors.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            {errors.email && (
              <div className="register-error">{errors.email}</div>
            )}
          </Col>
          <Col xs={12} sm={6}>
            <div className="register-input-group">
              <FiSmartphone className="register-input-icon" />
              <Form.Control
                type="tel"
                name="mobile"
                placeholder="Mobile Number"
                className={`register-input ${errors.mobile ? 'is-invalid' : ''}`}
                value={formData.mobile}
                onChange={handleChange}
                maxLength={10}
                required
                disabled={isTenant}
              />
            </div>
            {errors.mobile && (
              <div className="register-error">{errors.mobile}</div>
            )}
          </Col>
        </Row>

        <Row className="g-2 mt-2">
          <Col xs={12} sm={6}>
            <div className="register-input-group">
              <FiLock className="register-input-icon" />
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                className={`register-input ${errors.password ? 'is-invalid' : ''}`}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={togglePasswordVisibility}
                tabIndex="-1"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.password && (
              <div className="register-error">{errors.password}</div>
            )}
          </Col>
          <Col xs={12} sm={6}>
            <div className="register-input-group">
              <FiLock className="register-input-icon" />
              <Form.Control
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                className={`register-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                tabIndex="-1"
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="register-error">{errors.confirmPassword}</div>
            )}
          </Col>
        </Row>

        <Button 
          type="submit" 
          className="register-btn-primary mt-3"
          disabled={loading}
        >
          <FiMail size={18} />
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </Button>
      </Form>

      <div className="register-divider">
        <span>or</span>
      </div>

      <Link to="/login" className="register-login-link">
        <button className="register-btn-login">
          <FiLogIn size={18} />
          Already have an account? Login
        </button>
      </Link>
    </>
  );

  const renderOTPVerification = () => (
    <>
      <div className="otp-email-info">
        <FiMail size={20} className="otp-email-icon" />
        <span>OTP sent to <strong>{emailForOTP}</strong></span>
        <button className="otp-change-email" onClick={goBackToRegister}>
          Change
        </button>
      </div>

      {otpError && (
        <Alert variant="danger" className="register-alert">
          <FiAlertCircle size={16} />
          {otpError}
        </Alert>
      )}
      
      {otpSuccess && (
        <Alert variant="success" className="register-alert-success">
          <FiCheckCircle size={16} />
          {otpSuccess}
        </Alert>
      )}

      <div className="otp-inputs">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            className={`otp-input ${digit ? 'filled' : ''}`}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={handleOtpPaste}
            disabled={otpLoading}
          />
        ))}
      </div>

      <div className="otp-timer">
        {canResend ? (
          <button 
            className="otp-resend-btn"
            onClick={handleResendOTP}
            disabled={otpLoading}
          >
            <FiRefreshCw size={16} />
            Resend OTP
          </button>
        ) : (
          <span className="otp-timer-text">
            Resend in <strong>{timer}s</strong>
          </span>
        )}
      </div>

      <Button 
        className="register-btn-primary"
        onClick={handleVerifyOTP}
        disabled={otpLoading || otp.join('').length < 6}
      >
        <FiCheckCircle size={18} />
        {otpLoading ? 'Verifying...' : 'Verify & Create Account'}
      </Button>

      <div className="otp-back">
        <button className="otp-back-btn" onClick={goBackToRegister}>
          <FiArrowRight size={16} />
          Back to Registration
        </button>
      </div>
    </>
  );

  return (
    <div className="register-container">
      <div className="floating-circle c1"></div>
      <div className="floating-circle c2"></div>
      <div className="floating-circle c3"></div>

      <div className="register-card">
        <div className="register-logo">🏠</div>
        <h1 className="register-title">
          <span className="highlight">Rent</span>Flow
        </h1>
        <p className="register-subtitle">
          {step === 1 ? 'Create your account' : 'Verify your email'}
        </p>
        
        {error && (
          <Alert variant="danger" className="register-alert">
            <FiAlertCircle size={16} />
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="register-alert-success">
            <FiCheckCircle size={16} />
            {success}
          </Alert>
        )}

        {step === 1 ? renderRegistrationForm() : renderOTPVerification()}

        <div className="register-footer-features">
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

export default Register;