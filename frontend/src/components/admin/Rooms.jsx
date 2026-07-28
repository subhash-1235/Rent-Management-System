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
  FiBriefcase
} from 'react-icons/fi';
import { roomAPI } from '../../services/api';
import './Rooms.css';

// ========================================
// CUSTOM ALERT - CHHOTA + UPAR SE
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
// ADD ROOM MODAL
// ========================================
const AddRoomModal = ({ show, onHide, onRoomAdded }) => {
  const [formData, setFormData] = useState({
    room_number: '',
    tenant_name: '',
    tenant_mobile: '',
    room_rent: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        room_rent: parseFloat(formData.room_rent),
        room_number: parseInt(formData.room_number),
      };
      await roomAPI.create(data);
      onRoomAdded();
      onHide();
      setFormData({
        room_number: '',
        tenant_name: '',
        tenant_mobile: '',
        room_rent: '',
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
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Modal.Title style={{ color: 'var(--text-primary)' }}>🏠 Add New Room</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)' }}>
        {error && <CustomAlert type="error" message={error} onClose={() => setError(null)} />}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Room Number *</Form.Label>
            <Form.Control
              type="number"
              name="room_number"
              placeholder="Enter room number"
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
              }}
              value={formData.room_number}
              onChange={handleChange}
              required
              min="1"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Tenant Name</Form.Label>
            <Form.Control
              type="text"
              name="tenant_name"
              placeholder="Enter tenant name (optional)"
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
              }}
              value={formData.tenant_name}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Tenant Mobile</Form.Label>
            <Form.Control
              type="tel"
              name="tenant_mobile"
              placeholder="Enter 10-digit mobile number"
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
              }}
              value={formData.tenant_mobile}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, tenant_mobile: value });
              }}
              maxLength="10"
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Enter 10-digit mobile number (only numbers)
            </small>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Room Rent (₹) *</Form.Label>
            <Form.Control
              type="number"
              name="room_rent"
              placeholder="Enter room rent"
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
              }}
              value={formData.room_rent}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="is_active"
              label="Room is active"
              checked={formData.is_active}
              onChange={handleChange}
              style={{ color: 'var(--text-secondary)' }}
            />
          </Form.Group>

          <div className="d-flex gap-2 mt-3">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Adding...' : 'Add Room'}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide}>Cancel</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// ========================================
// EDIT ROOM MODAL
// ========================================
const EditRoomModal = ({ show, onHide, onRoomUpdated, room }) => {
  const [formData, setFormData] = useState({
    room_number: '',
    tenant_name: '',
    tenant_mobile: '',
    room_rent: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (room) {
      setFormData({
        room_number: room.room_number || '',
        tenant_name: room.tenant_name || '',
        tenant_mobile: room.tenant_mobile || '',
        room_rent: room.room_rent || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        room_rent: parseFloat(formData.room_rent),
        room_number: parseInt(formData.room_number),
      };
      await roomAPI.update(room.id, data);
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
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Modal.Title style={{ color: 'var(--text-primary)' }}>✏️ Edit Room</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)' }}>
        {error && <CustomAlert type="error" message={error} onClose={() => setError(null)} />}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Room Number *</Form.Label>
            <Form.Control
              type="number"
              name="room_number"
              placeholder="Enter room number"
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
              }}
              value={formData.room_number}
              onChange={handleChange}
              required
              min="1"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Tenant Name</Form.Label>
            <Form.Control
              type="text"
              name="tenant_name"
              placeholder="Enter tenant name (optional)"
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
              }}
              value={formData.tenant_name}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Tenant Mobile</Form.Label>
            <Form.Control
              type="tel"
              name="tenant_mobile"
              placeholder="Enter 10-digit mobile number"
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
              }}
              value={formData.tenant_mobile}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, tenant_mobile: value });
              }}
              maxLength="10"
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Enter 10-digit mobile number (only numbers)
            </small>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Room Rent (₹) *</Form.Label>
            <Form.Control
              type="number"
              name="room_rent"
              placeholder="Enter room rent"
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
              }}
              value={formData.room_rent}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="is_active"
              label="Room is active"
              checked={formData.is_active}
              onChange={handleChange}
              style={{ color: 'var(--text-secondary)' }}
            />
          </Form.Group>

          <div className="d-flex gap-2 mt-3">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Updating...' : 'Update Room'}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide}>Cancel</Button>
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
        tenant_name: status === 'occupied' ? room.tenant_name : '',
        tenant_mobile: status === 'occupied' ? room.tenant_mobile : '',
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
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Modal.Title style={{ color: 'var(--text-primary)' }}>🔄 Update Room Status</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)' }}>
        {error && <CustomAlert type="error" message={error} onClose={() => setError(null)} />}
        <Form onSubmit={handleSubmit}>
          <div className="status-selector">
            <div 
              className={`status-option ${status === 'occupied' ? 'active' : ''}`}
              onClick={() => setStatus('occupied')}
            >
              <div className="status-option-icon occupied-icon">✅</div>
              <div className="status-option-label">Occupied</div>
              <div className="status-option-desc">Room has a tenant</div>
            </div>
            <div 
              className={`status-option ${status === 'vacant' ? 'active' : ''}`}
              onClick={() => setStatus('vacant')}
            >
              <div className="status-option-icon vacant-icon">🏠</div>
              <div className="status-option-label">Vacant</div>
              <div className="status-option-desc">Room is empty</div>
            </div>
          </div>

          {status === 'vacant' && (
            <div className="vacant-warning">
              <FiX size={18} />
              <span>This will remove tenant details from this room.</span>
            </div>
          )}

          <div className="d-flex gap-2 mt-3">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide}>Cancel</Button>
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
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [alert, setAlert] = useState(null);

  // Search & Filter States
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
      setRooms(response.data || []);
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

    // Search - Room number (convert to string), Tenant name, Mobile
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(room => {
        const roomNumberStr = String(room.room_number);
        const tenantName = room.tenant_name ? room.tenant_name.toLowerCase() : '';
        const mobile = room.tenant_mobile ? room.tenant_mobile : '';
        
        return roomNumberStr.includes(term) ||
               tenantName.includes(term) ||
               mobile.includes(term);
      });
    }

    // Filter by Status
    if (filterStatus === 'occupied') {
      filtered = filtered.filter(room => room.tenant_name && room.is_active);
    } else if (filterStatus === 'vacant') {
      filtered = filtered.filter(room => !room.tenant_name || !room.is_active);
    }

    // Sort
    filtered.sort((a, b) => {
      let valA, valB;
      if (sortField === 'room_number') {
        valA = a.room_number;
        valB = b.room_number;
      } else if (sortField === 'room_rent') {
        valA = a.room_rent;
        valB = b.room_rent;
      } else if (sortField === 'tenant_name') {
        valA = a.tenant_name || '';
        valB = b.tenant_name || '';
      } else {
        valA = a.room_number;
        valB = b.room_number;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRooms(filtered);
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const handleAlertClose = () => {
    setAlert(null);
  };

  const handleRoomAdded = () => {
    fetchRooms();
    showAlert('success', '✅ Room added successfully!');
  };

  const handleRoomUpdated = () => {
    fetchRooms();
    showAlert('success', '✅ Room updated successfully!');
  };

  const handleStatusUpdated = () => {
    fetchRooms();
    showAlert('success', '✅ Room status updated successfully!');
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const handleStatusUpdate = (room) => {
    setSelectedRoom(room);
    setShowStatusModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await roomAPI.delete(id);
        fetchRooms();
        showAlert('success', '✅ Room deleted successfully!');
      } catch (err) {
        console.error('Error deleting room:', err);
        showAlert('error', '❌ Failed to delete room. Please try again.');
      }
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRooms = filteredRooms.slice(startIndex, endIndex);

  const stats = [
    { icon: <FiGrid size={22} />, number: rooms.length, label: 'Total Rooms', change: '+12%', cardClass: 'card-gold' },
    { icon: <FiUsers size={22} />, number: rooms.filter(r => r.tenant_name && r.is_active).length, label: 'Occupied', change: '+8%', cardClass: 'card-green' },
    { icon: <FiMapPin size={22} />, number: rooms.filter(r => !r.is_active || !r.tenant_name).length, label: 'Vacant', change: '-3%', cardClass: 'card-rose' },
    { icon: <FiBriefcase size={22} />, number: rooms.filter(r => r.tenant_mobile).length, label: 'With Contact', change: '+5%', cardClass: 'card-blue' },
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
      {/* Alert */}
      {alert && (
        <CustomAlert 
          type={alert.type} 
          message={alert.message} 
          onClose={handleAlertClose}
        />
      )}

      {/* Header - Rooms + Add Button */}
      <div className="rooms-header">
        <div>
          <h1>
            <FiHome size={28} className="rooms-header-icon" />
            Rooms
          </h1>
        </div>
        <button className="btn-primary-gradient" onClick={() => setShowAddModal(true)}>
          <FiPlus size={16} /> Add New Room
        </button>
      </div>

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

      {/* Search + Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by room no, tenant name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <FiFilter className="filter-icon" />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Rooms</option>
            <option value="occupied">Occupied</option>
            <option value="vacant">Vacant</option>
          </select>
        </div>

        <div className="room-count">
          {filteredRooms.length} rooms found
        </div>
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
                <th className="col-room" onClick={() => handleSort('room_number')}>
                  Room No {sortField === 'room_number' && (sortOrder === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />)}
                </th>
                <th className="col-tenant" onClick={() => handleSort('tenant_name')}>
                  Tenant Name {sortField === 'tenant_name' && (sortOrder === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />)}
                </th>
                <th className="col-mobile">Mobile</th>
                <th className="col-rent" onClick={() => handleSort('room_rent')}>
                  Rent (₹) {sortField === 'room_rent' && (sortOrder === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />)}
                </th>
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
                    <span className={`badge-status ${room.tenant_name && room.is_active ? 'occupied' : 'vacant'}`}>
                      {room.tenant_name && room.is_active ? '✅ Occupied' : '⏳ Vacant'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="table-actions">
                      <button 
                        className="action-btn status-btn" 
                        title="Update Status" 
                        onClick={() => handleStatusUpdate(room)}
                      >
                        <FiRefreshCw size={16} />
                      </button>
                      <button 
                        className="action-btn edit-btn" 
                        title="Edit" 
                        onClick={() => handleEdit(room)}
                      >
                        <FiEdit size={16} />
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        title="Delete" 
                        onClick={() => handleDelete(room.id)}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-custom">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Modals */}
      <AddRoomModal 
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onRoomAdded={handleRoomAdded}
      />

      <EditRoomModal 
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onRoomUpdated={handleRoomUpdated}
        room={selectedRoom}
      />

      <StatusUpdateModal 
        show={showStatusModal}
        onHide={() => setShowStatusModal(false)}
        room={selectedRoom}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
};

export default Rooms;