import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Table, Row, Col } from 'react-bootstrap';
import { FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiPhone, FiMail, FiHome } from 'react-icons/fi';
import { roomAPI } from '../../services/api';
import './Tenants.css';

// ========================================
// ADD TENANT MODAL
// ========================================
const AddTenantModal = ({ show, onHide, onTenantAdded, rooms }) => {
  const [formData, setFormData] = useState({
    room_id: '',
    tenant_name: '',
    tenant_mobile: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const room = rooms.find(r => r.id === parseInt(formData.room_id));
      if (!room) {
        setError('Room not found');
        setLoading(false);
        return;
      }

      await roomAPI.update(formData.room_id, {
        ...room,
        tenant_name: formData.tenant_name,
        tenant_mobile: formData.tenant_mobile,
      });
      
      onTenantAdded();
      onHide();
      setFormData({ room_id: '', tenant_name: '', tenant_mobile: '' });
      alert('Tenant added successfully!');
    } catch (err) {
      console.error('Error adding tenant:', err);
      setError('Failed to add tenant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Modal.Title style={{ color: 'var(--text-primary)' }}>👤 Add New Tenant</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)' }}>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Select Room *</Form.Label>
            <Form.Select 
              name="room_id" 
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
              }}
              value={formData.room_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a room</option>
              {rooms.filter(r => !r.tenant_name).map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number} - ₹{room.room_rent}/month
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Tenant Name *</Form.Label>
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
              }}
              value={formData.tenant_name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Mobile Number</Form.Label>
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

          <div className="d-flex gap-2 mt-3">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Adding...' : 'Add Tenant'}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide}>Cancel</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// ========================================
// EDIT TENANT MODAL
// ========================================
const EditTenantModal = ({ show, onHide, onTenantUpdated, tenant, rooms }) => {
  const [formData, setFormData] = useState({
    room_id: '',
    tenant_name: '',
    tenant_mobile: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tenant) {
      setFormData({
        room_id: tenant.room_id || tenant.id || '',
        tenant_name: tenant.tenant_name || '',
        tenant_mobile: tenant.tenant_mobile || '',
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

    try {
      const room = rooms.find(r => r.id === parseInt(formData.room_id));
      if (!room) {
        setError('Room not found');
        setLoading(false);
        return;
      }

      await roomAPI.update(formData.room_id, {
        ...room,
        tenant_name: formData.tenant_name,
        tenant_mobile: formData.tenant_mobile,
      });
      
      onTenantUpdated();
      onHide();
      alert('Tenant updated successfully!');
    } catch (err) {
      console.error('Error updating tenant:', err);
      setError('Failed to update tenant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Modal.Title style={{ color: 'var(--text-primary)' }}>✏️ Edit Tenant</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)' }}>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Select Room *</Form.Label>
            <Form.Select 
              name="room_id" 
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
              }}
              value={formData.room_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number} - ₹{room.room_rent}/month
                  {room.tenant_name ? ` (${room.tenant_name})` : ' (Vacant)'}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Tenant Name *</Form.Label>
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
              }}
              value={formData.tenant_name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Mobile Number</Form.Label>
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

          <div className="d-flex gap-2 mt-3">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Updating...' : 'Update Tenant'}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide}>Cancel</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// ========================================
// TENANTS MAIN
// ========================================
const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await roomAPI.getAll();
      setAllRooms(response.data || []);
      const tenantsList = response.data.filter(r => r.tenant_name);
      setTenants(tenantsList);
      setError(null);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Failed to load tenants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantAdded = () => fetchData();
  const handleTenantUpdated = () => fetchData();

  const handleEdit = (room) => {
    setSelectedTenant({
      id: room.id,
      room_id: room.id,
      tenant_name: room.tenant_name,
      tenant_mobile: room.tenant_mobile,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('Are you sure you want to remove this tenant?')) {
      try {
        const room = allRooms.find(r => r.id === roomId);
        if (room) {
          await roomAPI.update(roomId, {
            ...room,
            tenant_name: '',
            tenant_mobile: '',
          });
          fetchData();
          alert('Tenant removed successfully!');
        }
      } catch (err) {
        console.error('Error deleting tenant:', err);
        alert('Failed to remove tenant. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading tenants...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-4">{error}</Alert>;
  }

  const stats = [
    { icon: <FiUsers size={22} />, number: tenants.length, label: 'Total Tenants', change: '+12%', cardClass: 'card-gold' },
    { icon: <FiHome size={22} />, number: allRooms.length - tenants.length, label: 'Vacant Rooms', change: '-3%', cardClass: 'card-rose' },
    { icon: <FiPhone size={22} />, number: tenants.filter(t => t.tenant_mobile).length, label: 'With Contact', change: '+5%', cardClass: 'card-blue' },
    { icon: <FiMail size={22} />, number: tenants.filter(t => !t.tenant_mobile).length, label: 'No Contact', change: '+2%', cardClass: 'card-violet' },
  ];

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div>
          <h1>👥 Tenants</h1>
          <p>Manage all tenants</p>
        </div>
        <button className="btn-primary-gradient" onClick={() => setShowAddModal(true)}>
          <FiUserPlus size={16} /> Add New Tenant
        </button>
      </div>

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

      <div className="table-wrap">
        {tenants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No tenants found</div>
            <div className="empty-sub">Add tenants to rooms.</div>
            <button className="btn-primary-gradient mt-3" onClick={() => setShowAddModal(true)}>➕ Add Tenant</button>
          </div>
        ) : (
          <table className="table-premium">
            <thead>
              <tr>
                <th>#</th>
                <th>Room</th>
                <th>Tenant Name</th>
                <th>Mobile</th>
                <th>Rent (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, index) => (
                <tr key={tenant.id || index}>
                  <td>{index + 1}</td>
                  <td><strong>Room {tenant.room_number}</strong></td>
                  <td>
                    <div className="tenant-name">
                      <div className="avatar">
                        {tenant.tenant_name?.charAt(0) || '?'}
                      </div>
                      {tenant.tenant_name}
                    </div>
                  </td>
                  <td>{tenant.tenant_mobile || '—'}</td>
                  <td>₹{tenant.room_rent}</td>
                  <td>
                    <span className="badge-status occupied">✅ Active</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="edit" title="Edit" onClick={() => handleEdit(tenant)}>
                        <FiEdit2 size={14} />
                      </button>
                      <button className="delete" title="Remove" onClick={() => handleDelete(tenant.id)}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddTenantModal 
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onTenantAdded={handleTenantAdded}
        rooms={allRooms}
      />

      <EditTenantModal 
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onTenantUpdated={handleTenantUpdated}
        tenant={selectedTenant}
        rooms={allRooms}
      />
    </div>
  );
};

export default Tenants;