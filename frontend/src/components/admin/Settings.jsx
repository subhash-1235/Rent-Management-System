import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { FiSettings, FiSave, FiUser, FiGlobe, FiDollarSign, FiSmartphone, FiCreditCard, FiImage, FiUpload, FiTrash2, FiShield, FiClock } from 'react-icons/fi';
import { FaQrcode } from 'react-icons/fa';
import { qrAPI } from '../../services/api';
import './Settings.css';

const Settings = () => {
  const [qrSettings, setQrSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showFullQR, setShowFullQR] = useState(false);
  const [qrTab, setQrTab] = useState('upi');
  
  const [accountSettings, setAccountSettings] = useState({
    admin_name: 'Admin',
    admin_email: 'admin@rentflow.com',
    new_password: '',
    confirm_password: '',
  });

  const [generalSettings, setGeneralSettings] = useState({
    currency: 'INR',
    language: 'en',
  });

  useEffect(() => {
    fetchSettings();
    loadGeneralSettings();
    loadAccountSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await qrAPI.getSettings();
      if (response.data && response.data.length > 0) {
        setQrSettings(response.data[0]);
      } else {
        setQrSettings({ id: null, upi_id: '', qr_code_image: null });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Make sure server is running.');
      setQrSettings({ id: null, upi_id: '', qr_code_image: null });
    } finally {
      setLoading(false);
    }
  };

  const loadGeneralSettings = () => {
    const saved = localStorage.getItem('general_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGeneralSettings({
          currency: parsed.currency || 'INR',
          language: parsed.language || 'en',
        });
      } catch (e) {
        console.error('Error loading general settings:', e);
      }
    }
  };

  const loadAccountSettings = () => {
    const saved = localStorage.getItem('account_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAccountSettings({
          admin_name: parsed.admin_name || 'Admin',
          admin_email: parsed.admin_email || 'admin@rentflow.com',
          new_password: '',
          confirm_password: '',
        });
      } catch (e) {
        console.error('Error loading account settings:', e);
      }
    }
  };

  const saveGeneralSettings = (settings) => {
    localStorage.setItem('general_settings', JSON.stringify(settings));
  };

  const saveAccountSettings = (settings) => {
    localStorage.setItem('account_settings', JSON.stringify({
      admin_name: settings.admin_name,
      admin_email: settings.admin_email,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(null);
      setError(null);
      
      if (qrSettings && qrSettings.id) {
        const updateData = {
          upi_id: qrSettings.upi_id,
          is_active: true
        };
        await qrAPI.update(qrSettings.id, updateData);
      }
      
      saveGeneralSettings(generalSettings);
      saveAccountSettings(accountSettings);
      
      if (accountSettings.new_password && accountSettings.new_password.length > 0) {
        if (accountSettings.new_password !== accountSettings.confirm_password) {
          setError('Passwords do not match!');
          setSaving(false);
          return;
        }
        if (accountSettings.new_password.length < 6) {
          setError('Password must be at least 6 characters!');
          setSaving(false);
          return;
        }
        localStorage.setItem('user_password', accountSettings.new_password);
        setSuccess('Password changed successfully!');
      }
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.error || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setQrSettings({ ...qrSettings, [e.target.name]: e.target.value });
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings({ ...generalSettings, [name]: value });
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountSettings({ ...accountSettings, [name]: value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('File size too large. Maximum 2MB allowed.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result;
          
          if (!qrSettings.upi_id || qrSettings.upi_id.trim() === '') {
            setError('Please enter UPI ID first before uploading QR code.');
            setUploading(false);
            return;
          }
          
          const response = await qrAPI.upload({
            image: base64String,
            upi_id: qrSettings.upi_id.trim()
          });
          
          console.log('Upload response:', response.data);
          await fetchSettings();
          setSuccess('QR Code uploaded successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr.response?.data || uploadErr.message);
          setError(uploadErr.response?.data?.error || 'Failed to upload QR code. Please try again.');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file.');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to process file.');
      setUploading(false);
    }
  };

  const handleRemoveQR = async () => {
    try {
      if (qrSettings && qrSettings.id) {
        const updateData = {
          upi_id: qrSettings.upi_id,
          qr_code_image: null
        };
        await qrAPI.update(qrSettings.id, updateData);
        await fetchSettings();
        setSuccess('QR Code removed successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error removing QR:', err);
      setError('Failed to remove QR code.');
    }
  };

  const openFullQR = () => {
    if (qrSettings?.qr_code_image) {
      setShowFullQR(true);
    }
  };

  const closeFullQR = () => {
    setShowFullQR(false);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading settings...</p>
      </div>
    );
  }

  const stats = [
    { 
      icon: <FaQrcode size={22} />, 
      number: qrSettings?.upi_id ? '✅ Active' : '❌ Not Set', 
      label: 'QR Code Status', 
      cardClass: 'card-gold' 
    },
    { 
      icon: <FiDollarSign size={22} />, 
      number: generalSettings.currency || 'INR', 
      label: 'Default Currency', 
      cardClass: 'card-green' 
    },
    { 
      icon: <FiGlobe size={22} />, 
      number: generalSettings.language === 'en' ? 'English' : 'हिंदी', 
      label: 'Default Language', 
      cardClass: 'card-blue' 
    },
    { 
      icon: <FiShield size={22} />, 
      number: '🔒 Secure', 
      label: 'Security Status', 
      cardClass: 'card-purple' 
    },
  ];

  return (
    <div className="fade-in-up">
      <div className="settings-header">
        <div>
          <h1>⚙️ Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Manage your application settings
          </p>
        </div>
        <button 
          className="btn-primary-gradient"
          onClick={handleSave}
          disabled={saving}
        >
          <FiSave size={16} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" style={{ 
          background: 'rgba(248, 113, 113, 0.08)',
          border: '1px solid rgba(248, 113, 113, 0.1)',
          borderRadius: '10px',
          color: '#F87171'
        }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4" style={{ 
          background: 'rgba(52, 211, 153, 0.08)',
          border: '1px solid rgba(52, 211, 153, 0.1)',
          borderRadius: '10px',
          color: '#34D399'
        }}>
          {success}
        </Alert>
      )}

      <Row className="g-3 mb-4">
        {stats.map((stat, index) => (
          <Col md={3} sm={6} xs={6} key={index}>
            <div className={`stat-card ${stat.cardClass}`}>
              <div className="stat-left">
                <div className="stat-icon">{stat.icon}</div>
              </div>
              <div className="stat-right">
                <div className="stat-number" style={{ fontSize: stat.number.length > 10 ? '16px' : '20px' }}>
                  {stat.number}
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div className="stat-glow" />
            </div>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col md={6}>
          <div className="settings-card">
            <h5 className="settings-card-title">
              <FaQrcode size={20} />
              QR Code Settings
            </h5>
            
            <div className="qr-tabs">
              <button 
                className={`qr-tab-btn ${qrTab === 'upi' ? 'active' : ''}`}
                onClick={() => setQrTab('upi')}
              >
                <FiCreditCard size={16} />
                UPI ID
              </button>
              <button 
                className={`qr-tab-btn ${qrTab === 'qr' ? 'active' : ''}`}
                onClick={() => setQrTab('qr')}
              >
                <FiImage size={16} />
                QR Code
              </button>
            </div>

            <div className="qr-tab-content">
              {qrTab === 'upi' && (
                <Form className="settings-form">
                  <Form.Group>
                    <Form.Label>UPI ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="upi_id"
                      placeholder="Enter UPI ID (e.g., admin@paytm)"
                      value={qrSettings?.upi_id || ''}
                      onChange={handleChange}
                      style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Form.Text className="text-muted">
                      Enter your UPI ID for receiving payments
                    </Form.Text>
                  </Form.Group>
                </Form>
              )}

              {qrTab === 'qr' && (
                <div className="qr-upload-section">
                  <div className="qr-upload-area">
                    <label className="qr-upload-label">
                      <FiUpload size={20} />
                      <span>Choose QR Code Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                    <Form.Text className="text-muted">
                      {uploading ? 'Uploading...' : 'Upload QR code image (PNG, JPG)'}
                    </Form.Text>
                  </div>

                  {qrSettings?.qr_code_image && (
                    <div className="qr-preview-mini">
                      <div className="qr-preview-mini-img" onClick={openFullQR}>
                        <img 
                          src={qrSettings.qr_code_image} 
                          alt="QR Code" 
                        />
                        <div className="qr-preview-mini-overlay">
                          <span>🔍 Click to view full</span>
                        </div>
                      </div>
                      <button 
                        className="qr-remove-btn"
                        onClick={handleRemoveQR}
                      >
                        <FiTrash2 size={16} />
                        Remove
                      </button>
                    </div>
                  )}

                  {!qrSettings?.qr_code_image && (
                    <div className="qr-empty-state">
                      <FaQrcode size={32} />
                      <span>No QR Code uploaded</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Col>

        <Col md={6}>
          <div className="settings-card">
            <h5 className="settings-card-title">
              <FiSettings size={20} />
              General Settings
            </h5>
            <Form className="settings-form">
              <Form.Group className="mb-3">
                <Form.Label>Default Currency</Form.Label>
                <Form.Select 
                  name="currency"
                  value={generalSettings.currency}
                  onChange={handleGeneralChange}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="EUR">€ EUR (Euro)</option>
                  <option value="GBP">£ GBP (British Pound)</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Default Language</Form.Label>
                <Form.Select 
                  name="language"
                  value={generalSettings.language}
                  onChange={handleGeneralChange}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="hi">🇮🇳 हिंदी (Hindi)</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </div>
        </Col>
      </Row>

      <Row className="g-4 mt-2">
        <Col md={12}>
          <div className="settings-card">
            <h5 className="settings-card-title">
              <FiUser size={20} />
              Account Settings
            </h5>
            <Form className="settings-form">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Admin Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="admin_name"
                      placeholder="Enter admin name"
                      value={accountSettings.admin_name}
                      onChange={handleAccountChange}
                      style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Admin Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="admin_email"
                      placeholder="Enter admin email"
                      value={accountSettings.admin_email}
                      onChange={handleAccountChange}
                      style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="new_password"
                      placeholder="Enter new password"
                      value={accountSettings.new_password}
                      onChange={handleAccountChange}
                      style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirm_password"
                      placeholder="Confirm new password"
                      value={accountSettings.confirm_password}
                      onChange={handleAccountChange}
                      style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Form.Text className="text-muted">
                      Leave blank to keep current password
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </div>
        </Col>
      </Row>

      {/* Full QR Code View Modal */}
      <Modal show={showFullQR} onHide={closeFullQR} centered size="lg">
        <Modal.Body style={{ 
          padding: '20px', 
          background: 'rgba(0,0,0,0.92)', 
          position: 'relative', 
          minHeight: '60vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <img 
            src={qrSettings?.qr_code_image} 
            alt="QR Code Full View" 
            style={{ 
              width: 'auto', 
              height: 'auto', 
              maxWidth: '80%', 
              maxHeight: '80vh', 
              objectFit: 'contain',
              background: 'white',
              padding: '20px',
              borderRadius: '12px'
            }} 
          />
          <button 
            onClick={closeFullQR}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              fontSize: 28,
              width: 44,
              height: 44,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
          >
            ×
          </button>
          <button 
            onClick={closeFullQR}
            style={{
              position: 'absolute',
              bottom: 30,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '10px 30px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          >
            Close
          </button>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Settings;