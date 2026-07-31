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
// VIEW TENANT DETAILS MODAL
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

  const savedAadhar = JSON.parse(localStorage.getItem('room_aadhar_data') || '{}');
  const aadharData = savedAadhar[tenant.room_id] || {};

  const openFullImage = (imageUrl) => {
    setShowFullImage(imageUrl);
  };

  const closeFullImage = () => {
    setShowFullImage(null);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header style={{ borderBottom: '1px solid var(--border-color)', padding: '14px 20px' }}>
          <Modal.Title style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>
            <FiUser size={18} style={{ marginRight: '8px' }} />
            Tenant Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--bg-primary)', padding: '20px 24px', maxHeight: '70vh', overflow: 'auto' }}>
          <div className="tenant-detail-container">
            <div className="tenant-detail-header">
              <div className="tenant-detail-name">
                <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px', fontWeight: 700 }}>
                  {tenant.tenant_name}
                </h4>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
                  Room {tenant.room_number}
                </p>
              </div>
              <span className={`badge-status ${tenant.is_active ? 'occupied' : 'vacant'}`}>
                {tenant.is_active ? '✅ Active' : '⏳ Former'}
              </span>
            </div>

            <div className="tenant-detail-grid">
              <div className="tenant-detail-item">
                <label>📱 Mobile</label>
                <span>{tenant.tenant_mobile || '—'}</span>
              </div>
              <div className="tenant-detail-item">
                <label>📧 Email</label>
                <span>{tenant.tenant_email || '—'}</span>
              </div>
              <div className="tenant-detail-item">
                <label>🏠 Room Rent</label>
                <span>₹{tenant.room_rent || 0}</span>
              </div>
              <div className="tenant-detail-item">
                <label>📅 Move-in Date</label>
                <span>{formatDate(tenant.move_in_date)}</span>
              </div>
              {tenant.move_out_date && (
                <div className="tenant-detail-item">
                  <label>📅 Move-out Date</label>
                  <span>{formatDate(tenant.move_out_date)}</span>
                </div>
              )}
              <div className="tenant-detail-item">
                <label>⏳ Stay Duration</label>
                <span>
                  {tenant.move_in_date && tenant.move_out_date ? (
                    `${Math.ceil((new Date(tenant.move_out_date) - new Date(tenant.move_in_date)) / (1000 * 60 * 60 * 24))} days`
                  ) : tenant.move_in_date ? (
                    `${Math.ceil((new Date() - new Date(tenant.move_in_date)) / (1000 * 60 * 60 * 24))} days (ongoing)`
                  ) : '—'}
                </span>
              </div>
              {tenant.total_paid > 0 && (
                <div className="tenant-detail-item">
                  <label>💰 Total Paid</label>
                  <span style={{ color: '#34D399' }}>₹{tenant.total_paid}</span>
                </div>
              )}
              {tenant.total_bills > 0 && (
                <div className="tenant-detail-item">
                  <label>📋 Total Bills</label>
                  <span style={{ color: '#6C63FF' }}>₹{tenant.total_bills}</span>
                </div>
              )}
            </div>

            {tenant.address && (
              <div className="tenant-detail-notes">
                <label>📍 Address</label>
                <p>{tenant.address}</p>
              </div>
            )}

            <div className="tenant-detail-aadhar">
              <label>🪪 Aadhar Card</label>
              <div className="aadhar-images">
                <div
                  className="aadhar-image-box clickable"
                  onClick={() => aadharData.aadhar_front && openFullImage(aadharData.aadhar_front)}
                  style={{ cursor: aadharData.aadhar_front ? 'pointer' : 'default' }}
                >
                  {aadharData.aadhar_front ? (
                    <img src={aadharData.aadhar_front} alt="Aadhar Front" />
                  ) : (
                    <div className="aadhar-placeholder">Front Side</div>
                  )}
                  {aadharData.aadhar_front && (
                    <div className="aadhar-click-hint">🔍 Click to view full</div>
                  )}
                </div>
                <div
                  className="aadhar-image-box clickable"
                  onClick={() => aadharData.aadhar_back && openFullImage(aadharData.aadhar_back)}
                  style={{ cursor: aadharData.aadhar_back ? 'pointer' : 'default' }}
                >
                  {aadharData.aadhar_back ? (
                    <img src={aadharData.aadhar_back} alt="Aadhar Back" />
                  ) : (
                    <div className="aadhar-placeholder">Back Side</div>
                  )}
                  {aadharData.aadhar_back && (
                    <div className="aadhar-click-hint">🔍 Click to view full</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid var(--border-color)', padding: '10px 20px', background: 'var(--bg-glass)' }}>
          <Button className="btn-ghost" onClick={onHide} style={{ fontSize: '13px', padding: '6px 18px' }}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Full Image View Modal */}
      <Modal show={!!showFullImage} onHide={closeFullImage} centered size="lg">
        <Modal.Body style={{ padding: '0', background: 'rgba(0,0,0,0.92)', position: 'relative', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={showFullImage}
            alt="Aadhar Card Full View"
            style={{ width: '100%', height: 'auto', maxHeight: '90vh', objectFit: 'contain' }}
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

  const fetchAllTenants = async () => {
    try {
      setLoading(true);

      const roomsResponse = await roomAPI.getAll();
      const allRooms = roomsResponse.data || [];

      const historyResponse = await tenantHistoryAPI.getAllTenants();
      const historyData = historyResponse.data || [];

      const tenantMap = {};

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
            is_active: true,
            move_in_date: room.move_in_date,
            move_out_date: null,
            address: room.address || '',
            total_paid: 0,
            total_bills: 0,
          };
        }
      });

      historyData.forEach(history => {
        const key = `${history.tenant_name}_${history.room_number}`;
        if (!tenantMap[key] || !tenantMap[key].is_active) {
          tenantMap[key] = {
            tenant_name: history.tenant_name,
            tenant_mobile: history.tenant_mobile || '',
            tenant_email: history.tenant_email || '',
            room_number: history.room_number,
            room_id: history.room,
            room_rent: history.room_rent,
            is_active: false,
            move_in_date: history.move_in_date,
            move_out_date: history.move_out_date,
            address: history.address || '',
            total_paid: history.total_paid || 0,
            total_bills: history.total_bills || 0,
          };
        }
      });

      setTenants(Object.values(tenantMap));
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
      filtered = filtered.filter(tenant => tenant.is_active);
    } else if (filterType === 'past') {
      filtered = filtered.filter(tenant => !tenant.is_active);
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
    { icon: <FiCheck size={22} />, number: tenants.filter(t => t.is_active).length, label: 'Active', cardClass: 'card-green' },
    { icon: <FiClock size={22} />, number: tenants.filter(t => !t.is_active).length, label: 'Past', cardClass: 'card-rose' },
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
            <option value="past">Past</option>
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