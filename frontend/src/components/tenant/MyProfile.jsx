// src/components/tenant/MyProfile.jsx

import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FiUser, 
  FiMail, 
  FiSmartphone, 
  FiHome, 
  FiDollarSign,
  FiArrowLeft,
  FiSave,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit2
} from 'react-icons/fi';
import { tenantAPI } from '../../services/api';
import './MyProfile.css';

const MyProfile = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    room_number: '',
    room_rent: 0,
    is_registered: false,
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.getProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    if (passwordError) setPasswordError('');
    if (passwordSuccess) setPasswordSuccess('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await tenantAPI.updateProfile({
        name: formData.name,
        email: formData.email,
      });
      
      setProfile(prev => ({
        ...prev,
        name: response.data.tenant.name,
        email: response.data.tenant.email,
      }));
      
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new_password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);

    try {
      await tenantAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up tenant-profile">
      {/* Header */}
      <div className="profile-header">
        <div>
          <h1 className="profile-title">👤 My Profile</h1>
          <p className="profile-subtitle">View and manage your account details</p>
        </div>
        <button 
          className="btn-primary-gradient"
          onClick={() => navigate('/tenant-dashboard')}
        >
          <FiArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      <Row className="g-4">
        {/* Profile Information */}
        <Col lg={7}>
          <div className="profile-card">
            <div className="profile-card-header">
              <h5 className="profile-card-title">
                <FiUser size={18} />
                Profile Information
              </h5>
              <button
                className={`profile-edit-btn ${editMode ? 'active' : ''}`}
                onClick={toggleEditMode}
              >
                <FiEdit2 size={16} />
                {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {error && (
              <Alert variant="danger" className="profile-alert">
                <FiAlertCircle size={16} />
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="profile-alert success">
                <FiCheckCircle size={16} />
                {success}
              </Alert>
            )}

            {/* View Mode */}
            {!editMode ? (
              <div className="profile-view">
                <div className="profile-avatar">
                  {profile.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <h3 className="profile-name">{profile.name}</h3>
                <p className="profile-role">Tenant</p>
                
                <div className="profile-details">
                  <div className="profile-detail-item">
                    <FiMail className="detail-icon" />
                    <div>
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{profile.email || '—'}</span>
                    </div>
                  </div>
                  <div className="profile-detail-item">
                    <FiSmartphone className="detail-icon" />
                    <div>
                      <span className="detail-label">Mobile</span>
                      <span className="detail-value">{profile.mobile || '—'}</span>
                    </div>
                  </div>
                  <div className="profile-detail-item">
                    <FiHome className="detail-icon" />
                    <div>
                      <span className="detail-label">Room</span>
                      <span className="detail-value">Room {profile.room_number}</span>
                    </div>
                  </div>
                  <div className="profile-detail-item">
                    <FiDollarSign className="detail-icon" />
                    <div>
                      <span className="detail-label">Monthly Rent</span>
                      <span className="detail-value">₹{profile.room_rent}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-status">
                  <span className={`status-badge ${profile.is_registered ? 'registered' : 'unregistered'}`}>
                    {profile.is_registered ? '✅ Verified Account' : '⏳ Pending Verification'}
                  </span>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <Form onSubmit={handleProfileSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    className="profile-input"
                    value={formData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    className="profile-input"
                    value={formData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mobile Number</Form.Label>
                  <Form.Control
                    type="text"
                    className="profile-input"
                    value={profile.mobile || '—'}
                    disabled
                  />
                  <Form.Text className="text-muted">
                    Mobile number cannot be changed. Contact admin for assistance.
                  </Form.Text>
                </Form.Group>

                <div className="profile-actions">
                  <Button 
                    type="submit" 
                    className="profile-save-btn"
                    disabled={updating}
                  >
                    <FiSave size={16} />
                    {updating ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    type="button"
                    className="profile-cancel-btn"
                    onClick={toggleEditMode}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </div>
        </Col>

        {/* Change Password */}
        <Col lg={5}>
          <div className="profile-card password-card">
            <h5 className="profile-card-title">
              <FiLock size={18} />
              Change Password
            </h5>

            {passwordError && (
              <Alert variant="danger" className="profile-alert">
                <FiAlertCircle size={16} />
                {passwordError}
              </Alert>
            )}

            {passwordSuccess && (
              <Alert variant="success" className="profile-alert success">
                <FiCheckCircle size={16} />
                {passwordSuccess}
              </Alert>
            )}

            <Form onSubmit={handlePasswordSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <div className="password-input-group">
                  <Form.Control
                    type={showOldPassword ? 'text' : 'password'}
                    name="old_password"
                    placeholder="Enter current password"
                    className="profile-input"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <div className="password-input-group">
                  <Form.Control
                    type={showNewPassword ? 'text' : 'password'}
                    name="new_password"
                    placeholder="Enter new password (min 6 characters)"
                    className="profile-input"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirm New Password</Form.Label>
                <div className="password-input-group">
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    placeholder="Confirm your new password"
                    className="profile-input"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </Form.Group>

              <Button 
                type="submit" 
                className="password-change-btn"
                disabled={updatingPassword}
              >
                <FiLock size={16} />
                {updatingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </Form>
          </div>

          {/* Quick Stats */}
          <div className="profile-card quick-stats-card mt-3">
            <h5 className="profile-card-title">
              <FiHome size={18} />
              Room Details
            </h5>
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-stat-label">Room Number</span>
                <span className="quick-stat-value">{profile.room_number}</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-label">Monthly Rent</span>
                <span className="quick-stat-value">₹{profile.room_rent}</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-label">Account Status</span>
                <span className={`quick-stat-value ${profile.is_registered ? 'text-success' : 'text-warning'}`}>
                  {profile.is_registered ? 'Active' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default MyProfile;