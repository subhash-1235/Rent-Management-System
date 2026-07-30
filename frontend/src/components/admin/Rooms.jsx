import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Table, Row, Col } from 'react-bootstrap';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiUser, 
  FiPhone, 
  FiHome, 
  FiSearch, 
  FiCheck, 
  FiX, 
  FiMoreVertical,
  FiRefreshCw,
  FiAlertCircle,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiUsers,
  FiMapPin,
  FiBriefcase,
  FiEye,
  FiMail,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiClock
} from 'react-icons/fi';
import { roomAPI } from '../../services/api';
import './Rooms.css';

// ========================================
// CUSTOM ALERT
// ========================================
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
    info: {
      background: 'linear-gradient(135deg, #4A42C4, #6C63FF)',
      border: '1px solid rgba(108, 99, 255, 0.2)',
      boxShadow: '0 8px 30px rgba(108, 99, 255, 0.25)',
    },
  };

  const icons = {
    success: <FiCheck size={16} />,
    error: <FiX size={16} />,
    warning: <FiAlertCircle size={16} />,
    info: <FiMoreVertical size={16} />,
  };

  return (
    <div className="custom-alert-top" style={alertStyles[type]}>
      <div className="custom-alert-top-icon">{icons[type]}</div>
      <div className="custom-alert-top-message">{message}</div>
      <button 
        className="custom-alert-top-close" 
        onClick={() => { setVisible(false); if (onClose) onClose(); }}
      >
        ×
      </button>
    </div>
  );
};

// ========================================
// DELETE CONFIRMATION MODAL
// ========================================
const DeleteConfirmModal = ({ show, onHide, onConfirm, roomNumber }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header style={{ 
        borderBottom: '1px solid var(--border-color)',
        padding: '14px 20px',
        background: 'rgba(239, 68, 68, 0.05)'
      }}>
        <Modal.Title style={{ 
          color: '#F87171',
          fontSize: '17px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FiTrash2 size={18} style={{ color: '#F87171' }} />
          Delete Room
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)', padding: '16px 20px' }}>
        <div className="delete-confirm-content">
          <div className="delete-confirm-icon">
            <FiAlertCircle size={36} style={{ color: '#FBBF24' }} />
          </div>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: '4px', fontSize: '16px' }}>
            Delete Room?
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px', marginBottom: '0' }}>
            You are about to delete <strong style={{ color: 'var(--text-primary)' }}>Room {roomNumber}</strong>.
          </p>
          <div className="delete-warning-box">
            <FiAlertCircle size={14} style={{ color: '#F87171', flexShrink: 0 }} />
            <span style={{ fontSize: '12px' }}>
              This action cannot be undone. All tenant data and payment history for this room will be permanently removed.
            </span>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer style={{ 
        borderTop: '1px solid var(--border-color)',
        padding: '10px 20px',
        background: 'var(--bg-glass)',
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        <Button variant="secondary" className="btn-ghost" onClick={onHide} style={{ fontSize: '13px', padding: '6px 18px' }}>Cancel</Button>
        <Button className="btn-delete-confirm" onClick={handleConfirm} disabled={loading} style={{ fontSize: '13px', padding: '6px 18px' }}>
          {loading ? 'Deleting...' : 'Yes, Delete'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// ========================================
// ADD ROOM MODAL
// ========================================
const AddRoomModal = ({ show, onHide, onRoomAdded, rooms }) => {
  const [formData, setFormData] = useState({
    room_number: '',
    tenant_name: '',
    tenant_mobile: '',
    tenant_email: '',
    room_rent: '',
    move_in_date: '',
    address: '',
    aadhar_front: null,
    aadhar_back: null,
    aadhar_front_preview: null,
    aadhar_back_preview: null,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          [type]: file,
          [`${type}_preview`]: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.room_number) {
      setError('⚠️ Room Number is required.');
      setLoading(false);
      return;
    }
    if (!formData.tenant_name || formData.tenant_name.trim() === '') {
      setError('⚠️ Tenant Name is required.');
      setLoading(false);
      return;
    }
    if (!formData.tenant_mobile || formData.tenant_mobile.trim() === '') {
      setError('⚠️ Tenant Mobile is required.');
      setLoading(false);
      return;
    }
    if (!formData.room_rent) {
      setError('⚠️ Room Rent is required.');
      setLoading(false);
      return;
    }
    if (formData.tenant_mobile.length !== 10) {
      setError('⚠️ Mobile number must be exactly 10 digits.');
      setLoading(false);
      return;
    }
    if (!formData.aadhar_front) {
      setError('⚠️ Aadhar Card Front side is required.');
      setLoading(false);
      return;
    }
    if (!formData.aadhar_back) {
      setError('⚠️ Aadhar Card Back side is required.');
      setLoading(false);
      return;
    }

    const existingRoom = rooms.find(r => r.room_number === parseInt(formData.room_number));
    if (existingRoom) {
      if (existingRoom.tenant_name && existingRoom.tenant_name !== 'N/A' && existingRoom.tenant_name !== '') {
        setError(`⚠️ Room ${formData.room_number} already has a tenant: ${existingRoom.tenant_name}`);
        setLoading(false);
        return;
      } else {
        setError(`⚠️ Room ${formData.room_number} already exists. Please use Edit to update.`);
        setLoading(false);
        return;
      }
    }

    try {
      const data = {
        ...formData,
        room_rent: parseFloat(formData.room_rent),
        room_number: parseInt(formData.room_number),
        move_in_date: formData.move_in_date || null,
      };
      const response = await roomAPI.create(data);
      const roomId = response.data.id;
      
      const savedAadhar = JSON.parse(localStorage.getItem('room_aadhar_data') || '{}');
      savedAadhar[roomId] = {
        aadhar_front: formData.aadhar_front_preview,
        aadhar_back: formData.aadhar_back_preview,
      };
      localStorage.setItem('room_aadhar_data', JSON.stringify(savedAadhar));
      
      onRoomAdded();
      onHide();
      setFormData({
        room_number: '',
        tenant_name: '',
        tenant_mobile: '',
        tenant_email: '',
        room_rent: '',
        move_in_date: '',
        address: '',
        aadhar_front: null,
        aadhar_back: null,
        aadhar_front_preview: null,
        aadhar_back_preview: null,
        is_active: true,
      });
    } catch (err) {
      console.error('Error adding room:', err);
      setError('Failed to add room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 18px' }}>
        <Modal.Title style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
          🏠 Add New Room & Tenant
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)', padding: '14px 18px', maxHeight: '70vh', overflow: 'auto' }}>
        {error && <CustomAlert type="error" message={error} onClose={() => setError(null)} />}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Room Number <span style={{ color: '#F87171' }}>*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="room_number"
                  placeholder="Enter room number"
                  className="form-control"
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                  value={formData.room_number}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </Form.Group>
            </Col>
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
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Mobile Number <span style={{ color: '#F87171' }}>*</span></Form.Label>
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
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Enter 10-digit mobile number (only numbers)</small>
              </Form.Group>
            </Col>
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
          </Row>

          <Row>
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
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Move-in Date</Form.Label>
                <Form.Control
                  type="date"
                  name="move_in_date"
                  className="form-control"
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                  value={formData.move_in_date}
                  onChange={handleChange}
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

          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Aadhar (Front) <span style={{ color: '#F87171' }}>*</span>
                </Form.Label>
                <div className="aadhar-upload-box" onClick={() => document.getElementById('aadhar_front').click()}>
                  {formData.aadhar_front_preview ? (
                    <img src={formData.aadhar_front_preview} alt="Aadhar Front" />
                  ) : (
                    <div className="aadhar-upload-placeholder">
                      <FiFileText size={20} />
                      <span>Upload Front</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="aadhar_front"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'aadhar_front')}
                    style={{ display: 'none' }}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Aadhar (Back) <span style={{ color: '#F87171' }}>*</span>
                </Form.Label>
                <div className="aadhar-upload-box" onClick={() => document.getElementById('aadhar_back').click()}>
                  {formData.aadhar_back_preview ? (
                    <img src={formData.aadhar_back_preview} alt="Aadhar Back" />
                  ) : (
                    <div className="aadhar-upload-placeholder">
                      <FiFileText size={20} />
                      <span>Upload Back</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="aadhar_back"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'aadhar_back')}
                    style={{ display: 'none' }}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-2">
            <Form.Check
              type="checkbox"
              name="is_active"
              label="Room is active"
              checked={formData.is_active}
              onChange={handleChange}
              style={{ color: 'var(--text-secondary)', fontSize: '12px' }}
            />
          </Form.Group>

          <div className="d-flex gap-2 mt-2">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1, fontSize: '14px', padding: '10px' }}>
              {loading ? 'Adding...' : 'Add Room & Tenant'}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide} style={{ fontSize: '14px', padding: '10px 20px' }}>Cancel</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// ========================================
// EDIT ROOM MODAL
// ========================================
const EditRoomModal = ({ show, onHide, onRoomUpdated, room, rooms }) => {
  const [formData, setFormData] = useState({
    room_number: '',
    tenant_name: '',
    tenant_mobile: '',
    tenant_email: '',
    room_rent: '',
    move_in_date: '',
    address: '',
    aadhar_front: null,
    aadhar_back: null,
    aadhar_front_preview: null,
    aadhar_back_preview: null,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (room) {
      const savedAadhar = JSON.parse(localStorage.getItem('room_aadhar_data') || '{}');
      const aadharData = savedAadhar[room.id] || {};
      
      setFormData({
        room_number: room.room_number || '',
        tenant_name: room.tenant_name || '',
        tenant_mobile: room.tenant_mobile || '',
        tenant_email: room.tenant_email || '',
        room_rent: room.room_rent || '',
        move_in_date: room.move_in_date || '',
        address: room.address || '',
        aadhar_front: null,
        aadhar_back: null,
        aadhar_front_preview: aadharData.aadhar_front || null,
        aadhar_back_preview: aadharData.aadhar_back || null,
        is_active: room.is_active !== undefined ? room.is_active : true,
      });
    }
  }, [room]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          [type]: file,
          [`${type}_preview`]: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.room_number) {
      setError('⚠️ Room Number is required.');
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
    if (!formData.aadhar_front_preview) {
      setError('⚠️ Aadhar Card Front side is required.');
      setLoading(false);
      return;
    }
    if (!formData.aadhar_back_preview) {
      setError('⚠️ Aadhar Card Back side is required.');
      setLoading(false);
      return;
    }

    if (parseInt(formData.room_number) !== room.room_number) {
      const existingRoom = rooms.find(r => r.room_number === parseInt(formData.room_number));
      if (existingRoom) {
        setError(`⚠️ Room ${formData.room_number} already exists. Please use a different number.`);
        setLoading(false);
        return;
      }
    }

    try {
      const data = {
        ...formData,
        room_rent: parseFloat(formData.room_rent),
        room_number: parseInt(formData.room_number),
        move_in_date: formData.move_in_date || null,
      };
      await roomAPI.update(room.id, data);
      
      const savedAadhar = JSON.parse(localStorage.getItem('room_aadhar_data') || '{}');
      savedAadhar[room.id] = {
        aadhar_front: formData.aadhar_front_preview || null,
        aadhar_back: formData.aadhar_back_preview || null,
      };
      localStorage.setItem('room_aadhar_data', JSON.stringify(savedAadhar));
      
      onRoomUpdated();
      onHide();
    } catch (err) {
      console.error('Error updating room:', err);
      setError('Failed to update room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 18px' }}>
        <Modal.Title style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
          ✏️ Edit Room & Tenant
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)', padding: '14px 18px', maxHeight: '70vh', overflow: 'auto' }}>
        {error && <CustomAlert type="error" message={error} onClose={() => setError(null)} />}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Room Number <span style={{ color: '#F87171' }}>*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="room_number"
                  placeholder="Enter room number"
                  className="form-control"
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                  value={formData.room_number}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Tenant Name</Form.Label>
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
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
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
                <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Enter 10-digit mobile number (only numbers)</small>
              </Form.Group>
            </Col>
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
          </Row>

          <Row>
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
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Move-in Date</Form.Label>
                <Form.Control
                  type="date"
                  name="move_in_date"
                  className="form-control"
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                  value={formData.move_in_date}
                  onChange={handleChange}
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

          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Aadhar (Front) <span style={{ color: '#F87171' }}>*</span>
                </Form.Label>
                <div className="aadhar-upload-box" onClick={() => document.getElementById('aadhar_front').click()}>
                  {formData.aadhar_front_preview ? <img src={formData.aadhar_front_preview} alt="Aadhar Front" /> : <div className="aadhar-upload-placeholder"><FiFileText size={20} /><span>Upload Front</span></div>}
                  <input type="file" id="aadhar_front" accept="image/*" onChange={(e) => handleFileChange(e, 'aadhar_front')} style={{ display: 'none' }} />
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Aadhar (Back) <span style={{ color: '#F87171' }}>*</span>
                </Form.Label>
                <div className="aadhar-upload-box" onClick={() => document.getElementById('aadhar_back').click()}>
                  {formData.aadhar_back_preview ? <img src={formData.aadhar_back_preview} alt="Aadhar Back" /> : <div className="aadhar-upload-placeholder"><FiFileText size={20} /><span>Upload Back</span></div>}
                  <input type="file" id="aadhar_back" accept="image/*" onChange={(e) => handleFileChange(e, 'aadhar_back')} style={{ display: 'none' }} />
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-2">
            <Form.Check type="checkbox" name="is_active" label="Room is active" checked={formData.is_active} onChange={handleChange} style={{ color: 'var(--text-secondary)', fontSize: '12px' }} />
          </Form.Group>

          <div className="d-flex gap-2 mt-2">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1, fontSize: '14px', padding: '10px' }}>
              {loading ? 'Updating...' : 'Update Room & Tenant'}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide} style={{ fontSize: '14px', padding: '10px 20px' }}>Cancel</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// ========================================
// STATUS UPDATE MODAL
// ========================================
const StatusUpdateModal = ({ show, onHide, room, onStatusUpdated }) => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (room) {
      setStatus(room.is_active ? 'occupied' : 'vacant');
    }
  }, [room]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...room,
        is_active: status === 'occupied',
        tenant_name: status === 'occupied' ? room.tenant_name : null,
        tenant_mobile: status === 'occupied' ? room.tenant_mobile : null,
        is_deleted: status === 'vacant' ? true : false,
      };
      await roomAPI.update(room.id, data);
      onStatusUpdated();
      onHide();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 18px' }}>
        <Modal.Title style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>🔄 Update Room Status</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)', padding: '14px 18px' }}>
        {error && <CustomAlert type="error" message={error} onClose={() => setError(null)} />}
        <Form onSubmit={handleSubmit}>
          <div className="status-selector">
            <div className={`status-option ${status === 'occupied' ? 'active' : ''}`} onClick={() => setStatus('occupied')}>
              <div className="status-option-icon occupied-icon">✅</div>
              <div className="status-option-label">Occupied</div>
              <div className="status-option-desc">Room has a tenant</div>
            </div>
            <div className={`status-option ${status === 'vacant' ? 'active' : ''}`} onClick={() => setStatus('vacant')}>
              <div className="status-option-icon vacant-icon">🏠</div>
              <div className="status-option-label">Vacant</div>
              <div className="status-option-desc">Room is empty (will be hidden)</div>
            </div>
          </div>

          {status === 'vacant' && (
            <div className="vacant-warning">
              <FiX size={14} />
              <span style={{ fontSize: '13px' }}>
                ⚠️ This room will be hidden from the table. 
                Tenant details will be saved in "All Tenants" section.
              </span>
            </div>
          )}

          <div className="d-flex gap-2 mt-2">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1, fontSize: '14px', padding: '10px' }}>
              {loading ? 'Updating...' : status === 'vacant' ? 'Vacate & Hide Room' : 'Update Status'}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide} style={{ fontSize: '14px', padding: '10px 20px' }}>Cancel</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// ========================================
// ROOMS MAIN
// ========================================
const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('room_number');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rooms, searchTerm, filterStatus, sortField, sortOrder]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomAPI.getAll();
      
      const savedAadhar = JSON.parse(localStorage.getItem('room_aadhar_data') || '{}');
      const roomsWithAadhar = response.data.map(room => ({
        ...room,
        aadhar_front: savedAadhar[room.id]?.aadhar_front || null,
        aadhar_back: savedAadhar[room.id]?.aadhar_back || null,
      }));
      
      setRooms(roomsWithAadhar);
      setError(null);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rooms];

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(room => {
        const roomNumberStr = String(room.room_number);
        const tenantName = room.tenant_name ? room.tenant_name.toLowerCase() : '';
        const mobile = room.tenant_mobile ? room.tenant_mobile : '';
        const email = room.tenant_email ? room.tenant_email.toLowerCase() : '';
        
        return roomNumberStr.includes(term) || tenantName.includes(term) || mobile.includes(term) || email.includes(term);
      });
    }

    if (filterStatus === 'occupied') {
      filtered = filtered.filter(room => room.tenant_name && room.tenant_name !== 'N/A' && room.is_active);
    } else if (filterStatus === 'vacant') {
      filtered = filtered.filter(room => !room.is_active || !room.tenant_name || room.tenant_name === 'N/A');
    }

    filtered.sort((a, b) => {
      let valA, valB;
      if (sortField === 'room_number') { valA = a.room_number; valB = b.room_number; }
      else if (sortField === 'room_rent') { valA = a.room_rent; valB = b.room_rent; }
      else if (sortField === 'tenant_name') { valA = a.tenant_name || ''; valB = b.tenant_name || ''; }
      else { valA = a.room_number; valB = b.room_number; }

      if (typeof valA === 'string') { return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA); }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRooms(filtered);
  };

  const showAlert = (type, message) => { setAlert({ type, message }); };
  const handleAlertClose = () => { setAlert(null); };

  const handleRoomAdded = () => { fetchRooms(); showAlert('success', '✅ Room & Tenant added successfully!'); };
  const handleRoomUpdated = () => { fetchRooms(); showAlert('success', '✅ Room & Tenant updated successfully!'); };
  const handleStatusUpdated = () => { fetchRooms(); showAlert('success', '✅ Room status updated successfully!'); };

  const handleEdit = (room) => { setSelectedRoom(room); setShowEditModal(true); };
  const handleStatusUpdate = (room) => { setSelectedRoom(room); setShowStatusModal(true); };

  const handleDeleteClick = (room) => { setDeleteTarget(room); setShowDeleteModal(true); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await roomAPI.delete(deleteTarget.id);
      const savedAadhar = JSON.parse(localStorage.getItem('room_aadhar_data') || '{}');
      delete savedAadhar[deleteTarget.id];
      localStorage.setItem('room_aadhar_data', JSON.stringify(savedAadhar));
      fetchRooms();
      setShowDeleteModal(false);
      showAlert('success', `✅ Room ${deleteTarget.room_number} deleted successfully!`);
    } catch (err) {
      console.error('Error deleting room:', err);
      showAlert('error', '❌ Failed to delete room. Please try again.');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }
    else { setSortField(field); setSortOrder('asc'); }
  };

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRooms = filteredRooms.slice(startIndex, endIndex);

  const stats = [
    { icon: <FiGrid size={22} />, number: rooms.length, label: 'Total Rooms', change: '+12%', cardClass: 'card-gold' },
    { icon: <FiUsers size={22} />, number: rooms.filter(r => r.tenant_name && r.tenant_name !== 'N/A' && r.is_active).length, label: 'Occupied', change: '+8%', cardClass: 'card-green' },
    { icon: <FiMapPin size={22} />, number: rooms.filter(r => !r.is_active || !r.tenant_name || r.tenant_name === 'N/A').length, label: 'Vacant', change: '-3%', cardClass: 'card-rose' },
    { icon: <FiBriefcase size={22} />, number: rooms.filter(r => r.tenant_mobile && r.tenant_mobile !== 'N/A').length, label: 'With Contact', change: '+5%', cardClass: 'card-blue' },
  ];

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading rooms...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-4">{error}</Alert>;
  }

  return (
    <div className="fade-in-up">
      {alert && <CustomAlert type={alert.type} message={alert.message} onClose={handleAlertClose} />}

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {stats.map((stat, index) => (
          <Col md={3} sm={6} xs={6} key={index}>
            <div className={`stat-card ${stat.cardClass}`}>
              <div className="stat-left">
                <div className="stat-icon">{stat.icon}</div>
                <span className="stat-change">{stat.change}</span>
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

      {/* 🔥 Search + Filter + Add Button in One Row */}
      <div className="search-filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by room no, tenant name, mobile or email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="filter-box">
          <FiFilter className="filter-icon" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Rooms</option>
            <option value="occupied">Occupied</option>
            <option value="vacant">Vacant</option>
          </select>
        </div>
        <div className="room-count">{filteredRooms.length} rooms found</div>
        {/* 🔥 Add Button in Search Row - Right Side */}
        <button 
          className="btn-primary-gradient add-btn-small" 
          onClick={() => setShowAddModal(true)}
        >
          <FiPlus size={14} /> Add Room & Tenant
        </button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {filteredRooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <div className="empty-title">No rooms found</div>
            <div className="empty-sub">Try changing your search or filter.</div>
          </div>
        ) : (
          <table className="table-premium">
            <thead>
              <tr>
                <th className="col-sno">#</th>
                <th className="col-room" onClick={() => handleSort('room_number')}>Room No {sortField === 'room_number' && (sortOrder === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />)}</th>
                <th className="col-tenant" onClick={() => handleSort('tenant_name')}>Tenant Name {sortField === 'tenant_name' && (sortOrder === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />)}</th>
                <th className="col-mobile">Mobile</th>
                <th className="col-rent" onClick={() => handleSort('room_rent')}>Rent (₹) {sortField === 'room_rent' && (sortOrder === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />)}</th>
                <th className="col-status">Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRooms.map((room, index) => (
                <tr key={room.id || index}>
                  <td className="col-sno">{startIndex + index + 1}</td>
                  <td className="col-room"><strong>Room {room.room_number}</strong></td>
                  <td className="col-tenant">{room.tenant_name || '—'}</td>
                  <td className="col-mobile">{room.tenant_mobile || '—'}</td>
                  <td className="col-rent">₹{room.room_rent}</td>
                  <td className="col-status">
                    <span className={`badge-status ${room.tenant_name && room.tenant_name !== 'N/A' && room.is_active ? 'occupied' : 'vacant'}`}>
                      {room.tenant_name && room.tenant_name !== 'N/A' && room.is_active ? '✅ Occupied' : '⏳ Vacant'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="table-actions">
                      <button className="action-btn status-btn" title="Update Status" onClick={() => handleStatusUpdate(room)}><FiRefreshCw size={14} /></button>
                      <button className="action-btn edit-btn" title="Edit" onClick={() => handleEdit(room)}><FiEdit size={14} /></button>
                      <button className="action-btn delete-btn" title="Delete" onClick={() => handleDeleteClick(room)}><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-custom">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>← Prev</button>
          <span className="page-info">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next →</button>
        </div>
      )}

      <AddRoomModal show={showAddModal} onHide={() => setShowAddModal(false)} onRoomAdded={handleRoomAdded} rooms={rooms} />
      <EditRoomModal show={showEditModal} onHide={() => setShowEditModal(false)} onRoomUpdated={handleRoomUpdated} room={selectedRoom} rooms={rooms} />
      <StatusUpdateModal show={showStatusModal} onHide={() => setShowStatusModal(false)} room={selectedRoom} onStatusUpdated={handleStatusUpdated} />
      <DeleteConfirmModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={confirmDelete} roomNumber={deleteTarget?.room_number || ''} />
    </div>
  );
};

export default Rooms;