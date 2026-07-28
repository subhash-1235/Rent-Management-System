import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FiSettings, FiSave } from 'react-icons/fi';
import { FaQrcode } from 'react-icons/fa';
import { qrAPI } from '../../services/api';
import './Settings.css';

const Settings = () => {
  const [qrSettings, setQrSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await qrAPI.getSettings();
      if (response.data && response.data.length > 0) {
        setQrSettings(response.data[0]);
      } else {
        setQrSettings({ id: null, upi_id: '' });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings.');
      setQrSettings({ id: null, upi_id: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(null);
      setError(null);
      
      if (qrSettings.id) {
        await qrAPI.update(qrSettings.id, qrSettings);
      } else {
        console.log('Creating new settings:', qrSettings);
      }
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setQrSettings({ ...qrSettings, [e.target.name]: e.target.value });
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
    { icon: <FaQrcode size={22} />, number: qrSettings?.upi_id ? '✅ Active' : '❌ Not Set', label: 'QR Code Status', change: '', cardClass: 'card-gold' },
    { icon: <FiSettings size={22} />, number: 'v1.0', label: 'App Version', change: '', cardClass: 'card-blue' },
    { icon: '🔒', number: 'Secure', label: 'Security', change: '', cardClass: 'card-green' },
    { icon: '📱', number: 'Mobile Ready', label: 'Responsive', change: '', cardClass: 'card-purple' },
  ];

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div>
          <h1>⚙️ Settings</h1>
          <p>Manage your application settings</p>
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
                {stat.change && <span className="stat-change">{stat.change}</span>}
              </div>
              <div className="stat-right">
                <div className="stat-number" style={{ fontSize: stat.number.length > 10 ? '16px' : '24px' }}>
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
              <FaQrcode size={20} style={{ marginRight: 10 }} />
              QR Code Settings
            </h5>
            <Form className="settings-form">
              <Form.Group className="mb-3">
                <Form.Label>UPI ID</Form.Label>
                <Form.Control
                  type="text"
                  name="upi_id"
                  placeholder="Enter UPI ID (e.g., admin@paytm)"
                  value={qrSettings?.upi_id || ''}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>QR Code Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                />
                <Form.Text>
                  Upload QR code image for payments
                </Form.Text>
              </Form.Group>
            </Form>
          </div>
        </Col>

        <Col md={6}>
          <div className="settings-card">
            <h5 className="settings-card-title">
              <FiSettings size={20} style={{ marginRight: 10 }} />
              General Settings
            </h5>
            <Form className="settings-form">
              <Form.Group className="mb-3">
                <Form.Label>Default Currency</Form.Label>
                <Form.Select>
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Default Language</Form.Label>
                <Form.Select>
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Default Theme</Form.Label>
                <Form.Select>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;