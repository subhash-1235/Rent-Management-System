import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';
import {
  FiUsers,
  FiSearch,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiEye,
  FiEdit,
  FiX,
  FiAlertCircle,
  FiCheck,
  FiHome,
  FiClock,
  FiFilter,
  FiPlus
} from 'react-icons/fi';
import { roomAPI, tenantHistoryAPI } from '../../services/api';
import './AllTenants.css';

const CustomAlert = ({ type, message, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const alertStyles = {
    success: {
      background: 'linear-gradient(135deg, #0D9488, #059669)',
      border: '1px solid rgba(52, 211, 153, 0.2)',
      boxShadow: '0 8px 30px rgba(16, 185, 129, 0.25)',
    },
    error: {
      background: 'linear-gradient(135deg, #DC2626, #EF4444)',
      border: '1px solid rgba(248, 113, 113, 0.2)',
      boxShadow: '0 8px 30px rgba(239, 68, 68, 0.25)',
    },
    warning: {
      background: 'linear-gradient(135deg, #D97706, #FBBF24)',
      border: '1px solid rgba(251, 191, 36, 0.2)',
      boxShadow: '0 8px 30px rgba(251, 191, 36, 0.25)',
    },
  };

  const icons = {
    success: <FiCheck size={16} />,
    error: <FiX size={16} />,
    warning: <FiAlertCircle size={16} />,
  };

  return (
    <div className="custom-alert-top" style={alertStyles[type]}>
      <div className="custom-alert-top-icon">{icons[type]}</div>
      <div className="custom-alert-top-message">{message}</div>
      <button className="custom-alert-top-close" onClick={() => { setVisible(false); if (onClose) onClose(); }}>
        ×
      </button>
    </div>
  );
};

// ========================================
// VIEW TENANT DETAILS MODAL - INSTANT (PRE-FETCHED AADHAR)
// ========================================
const ViewTenantDetailsModal = ({ show, onHide, tenant }) => {
  const [showFullImage, setShowFullImage] = useState(null);

  if (!tenant) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const openFullImage = (imageUrl) => {
    if (imageUrl) setShowFullImage(imageUrl);
  };

  const closeFullImage = () => {
    setShowFullImage(null);
  };

  const hasAadharFront = tenant.aadhar_front && tenant.aadhar_front !== '';
  const hasAadharBack = tenant.aadhar_back && tenant.aadhar_back !== '';

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header style={{ 
          borderBottom: '1px solid var(--border-color)', 
          padding: '16px 24px',
          background: 'var(--bg-glass)'
        }}>
          <Modal.Title style={{ 
            color: 'var(--text-primary)', 
            fontSize: '18px', 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C63FF, #4A42C4)',
              color: 'white'
            }}>
              <FiUser size={18} />
            </span>
            Tenant Details
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{ 
          background: 'var(--bg-primary)', 
          padding: '20px 24px', 
          maxHeight: '70vh', 
          overflow: 'auto' 
        }}>
          <div className="tenant-detail-container">
            {/* Header */}
            <div className="tenant-detail-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div className="tenant-detail-name">
                <h4 style={{ 
                  color: 'var(--text-primary)', 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: 700 
                }}>
                  {tenant.tenant_name}
                </h4>
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  margin: '4px 0 0 0', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>🏠</span>
                  Room {tenant.room_number}
                </p>
              </div>
              <span className={`badge-status ${tenant.is_active ? 'occupied' : 'vacant'}`}
                style={{
                  padding: '4px 14px',
                  borderRadius: '50px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: tenant.is_active 
                    ? 'rgba(52, 211, 153, 0.12)' 
                    : 'rgba(248, 113, 113, 0.12)',
                  color: tenant.is_active ? '#34D399' : '#F87171',
                  border: `1px solid ${tenant.is_active ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)'}`
                }}
              >
                {tenant.is_active ? '✅ Active' : '⏳ Former'}
              </span>
            </div>

            {/* Info Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '14px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                padding: '10px 14px',
                background: 'var(--bg-glass)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <label style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  color: 'var(--text-muted)'
                }}>📱 Mobile</label>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>{tenant.tenant_mobile || '—'}</span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                padding: '10px 14px',
                background: 'var(--bg-glass)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                wordBreak: 'break-all'
              }}>
                <label style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  color: 'var(--text-muted)'
                }}>📧 Email</label>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  wordBreak: 'break-all',
                  overflowWrap: 'break-word'
                }}>{tenant.tenant_email || '—'}</span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                padding: '10px 14px',
                background: 'var(--bg-glass)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <label style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  color: 'var(--text-muted)'
                }}>💰 Room Rent</label>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#6C63FF'
                }}>₹{tenant.room_rent || 0}</span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                padding: '10px 14px',
                background: 'var(--bg-glass)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <label style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  color: 'var(--text-muted)'
                }}>📅 Move-in</label>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>{formatDate(tenant.move_in_date)}</span>
              </div>

              {tenant.move_out_date && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  padding: '10px 14px',
                  background: 'var(--bg-glass)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}>
                  <label style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    color: 'var(--text-muted)'
                  }}>📅 Move-out</label>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--text-primary)'
                  }}>{formatDate(tenant.move_out_date)}</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                padding: '10px 14px',
                background: 'var(--bg-glass)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <label style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  color: 'var(--text-muted)'
                }}>⏳ Stay</label>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>
                  {tenant.move_in_date && tenant.move_out_date ? (
                    `${Math.ceil((new Date(tenant.move_out_date) - new Date(tenant.move_in_date)) / (1000 * 60 * 60 * 24))} days`
                  ) : tenant.move_in_date ? (
                    `${Math.ceil((new Date() - new Date(tenant.move_in_date)) / (1000 * 60 * 60 * 24))} days (ongoing)`
                  ) : '—'}
                </span>
              </div>

              {tenant.total_paid > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  padding: '10px 14px',
                  background: 'rgba(52, 211, 153, 0.06)',
                  borderRadius: '10px',
                  border: '1px solid rgba(52, 211, 153, 0.1)'
                }}>
                  <label style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    color: 'var(--text-muted)'
                  }}>💰 Paid</label>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#34D399'
                  }}>₹{tenant.total_paid}</span>
                </div>
              )}

              {tenant.total_bills > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  padding: '10px 14px',
                  background: 'rgba(108, 99, 255, 0.06)',
                  borderRadius: '10px',
                  border: '1px solid rgba(108, 99, 255, 0.1)'
                }}>
                  <label style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    color: 'var(--text-muted)'
                  }}>📋 Bills</label>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#6C63FF'
                  }}>₹{tenant.total_bills}</span>
                </div>
              )}
            </div>

            {/* Address Section */}
            {tenant.address && (
              <div style={{
                marginTop: '6px',
                padding: '12px 16px',
                background: 'var(--bg-glass)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <label style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: '4px'
                }}>📍 Address</label>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: '1.5',
                  wordBreak: 'break-word'
                }}>{tenant.address}</p>
              </div>
            )}

            {/* Aadhar Section */}
            <div style={{ marginTop: '14px' }}>
              <label style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '8px'
              }}>🪪 Aadhar Card</label>
              
              {(!hasAadharFront && !hasAadharBack) ? (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  background: 'var(--bg-glass)',
                  borderRadius: '10px',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-muted)'
                }}>
                  <span style={{ fontSize: '14px' }}>📄 No Aadhar card uploaded</span>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  {hasAadharFront && (
                    <div
                      style={{
                        flex: '1 1 120px',
                        minWidth: '100px',
                        maxWidth: '160px',
                        height: '80px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '2px solid var(--border-color)',
                        background: 'var(--bg-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => openFullImage(tenant.aadhar_front)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#6C63FF';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <img src={tenant.aadhar_front} alt="Aadhar Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: '8px',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>🔍 Click</div>
                    </div>
                  )}
                  
                  {hasAadharBack && (
                    <div
                      style={{
                        flex: '1 1 120px',
                        minWidth: '100px',
                        maxWidth: '160px',
                        height: '80px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '2px solid var(--border-color)',
                        background: 'var(--bg-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => openFullImage(tenant.aadhar_back)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#6C63FF';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <img src={tenant.aadhar_back} alt="Aadhar Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: '8px',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>🔍 Click</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        
        <Modal.Footer style={{ 
          borderTop: '1px solid var(--border-color)', 
          padding: '10px 20px', 
          background: 'var(--bg-glass)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button 
            onClick={onHide} 
            style={{
              padding: '6px 24px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-glass)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-card-hover)';
              e.currentTarget.style.borderColor = '#6C63FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-glass)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            ✕ Close
          </button>
        </Modal.Footer>
      </Modal>

      {/* Full Image View Modal */}
      <Modal show={!!showFullImage} onHide={closeFullImage} centered size="lg">
        <Modal.Body style={{ 
          padding: '0', 
          background: 'rgba(0,0,0,0.92)', 
          position: 'relative', 
          minHeight: '60vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '12px'
        }}>
          <img
            src={showFullImage}
            alt="Aadhar Card Full View"
            style={{ 
              width: '100%', 
              height: 'auto', 
              maxHeight: '90vh', 
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <button
            onClick={closeFullImage}
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
            onClick={closeFullImage}
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '8px 24px',
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
    </>
  );
};

// ========================================
// EDIT TENANT MODAL
// ========================================
const EditTenantModal = ({ show, onHide, tenant, onTenantUpdated }) => {
  const [formData, setFormData] = useState({
    tenant_name: '',
    tenant_mobile: '',
    tenant_email: '',
    room_rent: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tenant) {
      setFormData({
        tenant_name: tenant.tenant_name || '',
        tenant_mobile: tenant.tenant_mobile || '',
        tenant_email: tenant.tenant_email || '',
        room_rent: tenant.room_rent || '',
        address: tenant.address || '',
      });
    }
  }, [tenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.tenant_name || formData.tenant_name.trim() === '') {
      setError('⚠️ Tenant Name is required.');
      setLoading(false);
      return;
    }
    if (!formData.room_rent) {
      setError('⚠️ Room Rent is required.');
      setLoading(false);
      return;
    }
    if (formData.tenant_mobile && formData.tenant_mobile.length !== 10 && formData.tenant_mobile.length > 0) {
      setError('⚠️ Mobile number must be exactly 10 digits.');
      setLoading(false);
      return;
    }

    try {
      const data = {
        ...tenant,
        tenant_name: formData.tenant_name,
        tenant_mobile: formData.tenant_mobile || null,
        tenant_email: formData.tenant_email || null,
        room_rent: parseFloat(formData.room_rent),
        address: formData.address || null,
      };

      await roomAPI.update(tenant.room_id, data);
      onTenantUpdated();
      onHide();
    } catch (err) {
      console.error('Error updating tenant:', err);
      setError('Failed to update tenant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 18px' }}>
        <Modal.Title style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
          ✏️ Edit Tenant Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)', padding: '14px 18px', maxHeight: '70vh', overflow: 'auto' }}>
        {error && <CustomAlert type="error" message={error} onClose={() => setError(null)} />}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Tenant Name <span style={{ color: '#F87171' }}>*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="tenant_name"
                  placeholder="Enter tenant name"
                  className="form-control"
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                  value={formData.tenant_name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Mobile Number</Form.Label>
                <Form.Control
                  type="tel"
                  name="tenant_mobile"
                  placeholder="Enter 10-digit mobile number"
                  className="form-control"
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                  value={formData.tenant_mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, tenant_mobile: value });
                  }}
                  maxLength="10"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="tenant_email"
                  placeholder="Enter email address"
                  className="form-control"
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                  value={formData.tenant_email}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Room Rent (₹) <span style={{ color: '#F87171' }}>*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="room_rent"
                  placeholder="Enter room rent"
                  className="form-control"
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                  value={formData.room_rent}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-2">
            <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>📍 Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="address"
              placeholder="Enter full address"
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                resize: 'vertical',
              }}
              value={formData.address}
              onChange={handleChange}
            />
          </Form.Group>

          <div className="d-flex gap-2 mt-2">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1, fontSize: '14px', padding: '10px' }}>
              {loading ? 'Updating...' : 'Update Tenant'}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide} style={{ fontSize: '14px', padding: '10px 20px' }}>Cancel</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// ========================================
// ALL TENANTS MAIN COMPONENT
// ========================================
const AllTenants = () => {
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchAllTenants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tenants, searchTerm, filterType]);

  // 🔥 UPDATED: Fetch ALL tenants (active + former) with Aadhar
  const fetchAllTenants = async () => {
    try {
      setLoading(true);

      // 🔥 Get ALL rooms (including inactive/vacant)
      const roomsResponse = await roomAPI.getAll();
      const allRooms = roomsResponse.data || [];

      const historyResponse = await tenantHistoryAPI.getAllTenants();
      const historyData = historyResponse.data || [];

      const tenantMap = {};

      // 🔥 Add tenants from rooms (both active and inactive)
      allRooms.forEach(room => {
        if (room.tenant_name && room.tenant_name.trim() !== '') {
          const key = `${room.tenant_name}_${room.room_number}`;
          tenantMap[key] = {
            tenant_name: room.tenant_name,
            tenant_mobile: room.tenant_mobile || '',
            tenant_email: room.tenant_email || '',
            room_number: room.room_number,
            room_id: room.id,
            room_rent: room.room_rent,
            is_active: room.is_active || false,
            move_in_date: room.move_in_date,
            move_out_date: room.is_active ? null : (room.move_out_date || new Date().toISOString().split('T')[0]),
            address: room.address || '',
            total_paid: 0,
            total_bills: 0,
            aadhar_front: room.aadhar_front || null,
            aadhar_back: room.aadhar_back || null,
          };
        }
      });

      // 🔥 Add tenants from history (if not already in map)
      historyData.forEach(history => {
        const key = `${history.tenant_name}_${history.room_number}`;
        if (!tenantMap[key]) {
          tenantMap[key] = {
            tenant_name: history.tenant_name,
            tenant_mobile: history.tenant_mobile || '',
            tenant_email: history.tenant_email || '',
            room_number: history.room_number,
            room_id: history.room,
            room_rent: history.room_rent,
            is_active: false,
            move_in_date: history.move_in_date,
            move_out_date: history.move_out_date || new Date().toISOString().split('T')[0],
            address: history.address || '',
            total_paid: history.total_paid || 0,
            total_bills: history.total_bills || 0,
            aadhar_front: null,
            aadhar_back: null,
          };
        }
      });

      // 🔥 Convert to array and sort: Active first, then Former
      const tenantArray = Object.values(tenantMap);
      tenantArray.sort((a, b) => {
        // Active tenants first (is_active === true)
        if (a.is_active === true && b.is_active === false) return -1;
        if (a.is_active === false && b.is_active === true) return 1;
        // If both active or both former, sort by name
        return a.tenant_name.localeCompare(b.tenant_name);
      });

      setTenants(tenantArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Failed to load tenants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tenants];

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(tenant => {
        const name = tenant.tenant_name ? tenant.tenant_name.toLowerCase() : '';
        const mobile = tenant.tenant_mobile || '';
        const room = String(tenant.room_number);
        const email = tenant.tenant_email ? tenant.tenant_email.toLowerCase() : '';
        return name.includes(term) || mobile.includes(term) || room.includes(term) || email.includes(term);
      });
    }

    if (filterType === 'active') {
      filtered = filtered.filter(tenant => tenant.is_active === true);
    } else if (filterType === 'past') {
      filtered = filtered.filter(tenant => tenant.is_active === false);
    }

    setFilteredTenants(filtered);
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleView = (tenant) => {
    setSelectedTenant(tenant);
    setShowViewModal(true);
  };

  const handleEdit = (tenant) => {
    setSelectedTenant(tenant);
    setShowEditModal(true);
  };

  const handleTenantUpdated = () => {
    fetchAllTenants();
    showAlert('success', '✅ Tenant updated successfully!');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTenants = filteredTenants.slice(startIndex, endIndex);

  const stats = [
    { icon: <FiUsers size={22} />, number: tenants.length, label: 'Total Tenants', cardClass: 'card-gold' },
    { icon: <FiCheck size={22} />, number: tenants.filter(t => t.is_active === true).length, label: 'Active', cardClass: 'card-green' },
    { icon: <FiClock size={22} />, number: tenants.filter(t => t.is_active === false).length, label: 'Former', cardClass: 'card-rose' },
    { icon: <FiHome size={22} />, number: new Set(tenants.map(t => t.room_number)).size, label: 'Rooms Used', cardClass: 'card-blue' },
  ];

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading tenants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-5">
        <p style={{ color: '#F87171' }}>{error}</p>
        <button className="btn-primary-gradient" onClick={fetchAllTenants}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      {alert && (
        <CustomAlert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="tenants-header">
        <h1>
          <FiUsers size={28} className="tenants-header-icon" />
          All Tenants
        </h1>
        <button className="btn-primary-gradient" onClick={fetchAllTenants}>
          <FiUsers size={16} /> Refresh
        </button>
      </div>

      <Row className="g-3 mb-4">
        {stats.map((stat, index) => (
          <Col md={3} sm={6} xs={6} key={index}>
            <div className={`stat-card ${stat.cardClass}`}>
              <div className="stat-left">
                <div className="stat-icon">{stat.icon}</div>
              </div>
              <div className="stat-right">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div className="stat-glow" />
            </div>
          </Col>
        ))}
      </Row>

      <div className="search-filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by tenant name, mobile, room no or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FiFilter className="filter-icon" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Tenants</option>
            <option value="active">Active</option>
            <option value="past">Former</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        {filteredTenants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <div className="empty-title">No tenants found</div>
            <div className="empty-sub">Try changing your search or filter.</div>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="table-premium tenant-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Room</th>
                  <th>Tenant</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Move In</th>
                  <th>Move Out</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentTenants.map((tenant, index) => {
                  const moveOutDisplay = tenant.is_active
                    ? '🟢 Ongoing'
                    : formatDate(tenant.move_out_date);

                  return (
                    <tr key={index}>
                      <td>{startIndex + index + 1}</td>
                      <td><strong>Room {tenant.room_number}</strong></td>
                      <td>{tenant.tenant_name}</td>
                      <td>{tenant.tenant_mobile || '—'}</td>
                      <td>
                        <span className={`badge-status ${tenant.is_active ? 'occupied' : 'vacant'}`}>
                          {tenant.is_active ? '✅ Active' : '⏳ Former'}
                        </span>
                      </td>
                      <td>{formatDate(tenant.move_in_date)}</td>
                      <td style={{ color: tenant.is_active ? '#34D399' : 'var(--text-secondary)' }}>
                        {moveOutDisplay}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-btn view-btn"
                            title="View Details"
                            onClick={() => handleView(tenant)}
                          >
                            <FiEye size={14} />
                          </button>
                          <button
                            className="action-btn edit-btn"
                            title="Edit"
                            onClick={() => handleEdit(tenant)}
                          >
                            <FiEdit size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-custom">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            ← Prev
          </button>
          <span className="page-info">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            Next →
          </button>
        </div>
      )}

      <ViewTenantDetailsModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        tenant={selectedTenant}
      />

      <EditTenantModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        tenant={selectedTenant}
        onTenantUpdated={handleTenantUpdated}
      />
    </div>
  );
};

export default AllTenants;