import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiDollarSign, 
  FiCheckCircle, 
  FiClock,
  FiPlus,
  FiUsers,
  FiFileText,
  FiDownload 
} from 'react-icons/fi';
import { dashboardAPI, roomAPI } from '../../services/api';
import './AdminDashboard.css';

// ========================================
// ROOM TABLE COMPONENT - FIXED
// ========================================
const RoomTable = ({ rooms = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(rooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRooms = rooms.slice(startIndex, endIndex);

  const getStatusBadge = (isPaid) => {
    if (isPaid) {
      return { class: 'paid', label: '✅ Paid' };
    }
    return { class: 'pending', label: '⏳ Pending' };
  };

  if (rooms.length === 0) {
    return (
      <div className="table-wrap">
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <div className="empty-title">No rooms found</div>
          <div className="empty-sub">Add your first room to get started.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table-premium">
        <thead>
          <tr>
            <th className="col-sno">#</th>
            <th className="col-room">Room No</th>
            <th className="col-tenant">Tenant Name</th>
            <th className="col-mobile">Mobile</th>
            <th className="col-units">Units</th>
            <th className="col-rent">Rent</th>
            <th className="col-bill">Bill</th>
            <th className="col-total">Total</th>
            <th className="col-status">Status</th>
          </tr>
        </thead>
        <tbody>
          {currentRooms.map((room, index) => {
            // Fix: Properly access room data
            const roomData = room.room || room;
            const roomNumber = roomData.room_number || room.id || 'N/A';
            const tenantName = roomData.tenant_name || 'N/A';
            const tenantMobile = roomData.tenant_mobile || 'N/A';
            const roomRent = roomData.room_rent || 0;
            
            const status = getStatusBadge(room.is_paid);
            
            return (
              <tr key={room.id || index}>
                <td className="col-sno">{startIndex + index + 1}</td>
                <td className="col-room"><strong>Room {roomNumber}</strong></td>
                <td className="col-tenant">{tenantName}</td>
                <td className="col-mobile">{tenantMobile}</td>
                <td className="col-units">{room.units_consumed || 0}</td>
                <td className="col-rent">₹{roomRent}</td>
                <td className="col-bill">₹{room.electricity_charge || 0}</td>
                <td className="col-total"><strong>₹{room.total_amount || 0}</strong></td>
                <td className="col-status">
                  <span className={`badge-status ${status.class}`}>
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
    </div>
  );
};

// ========================================
// ADMIN DASHBOARD MAIN - FIXED
// ========================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, roomsRes] = await Promise.all([
        dashboardAPI.getStats(),
        roomAPI.getAll(),
      ]);
      
      // Fix: Properly format stats data
      const statsData = {
        totalRooms: statsRes.data.total_rooms || 0,
        totalCollection: statsRes.data.total_amount || 0,
        paid: statsRes.data.paid_amount || 0,
        pending: statsRes.data.pending_amount || 0,
      };
      
      setStats(statsData);
      
      // Fix: Ensure rooms data is properly structured
      const roomsData = roomsRes.data || [];
      // Map rooms to include room details properly
      const formattedRooms = roomsData.map(room => ({
        ...room,
        room_number: room.room_number || room.id,
        tenant_name: room.tenant_name || 'N/A',
        tenant_mobile: room.tenant_mobile || 'N/A',
        room_rent: room.room_rent || 0,
        is_active: room.is_active !== undefined ? room.is_active : true,
        total_amount: room.total_amount || 0,
        electricity_charge: room.electricity_charge || 0,
        units_consumed: room.units_consumed || 0,
        is_paid: room.is_paid || false,
      }));
      setRooms(formattedRooms);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBill = () => navigate('/bills');
  const handleManageRooms = () => navigate('/rooms');
  const handleHistory = () => navigate('/history');
  const handleExport = () => alert('Export feature coming soon!');

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mt-4">
        {error}
      </Alert>
    );
  }

  const statCards = stats ? [
    { icon: <FiHome size={22} />, number: stats.totalRooms, label: 'Total Rooms', change: '+12%', cardClass: 'card-gold' },
    { icon: <FiDollarSign size={22} />, number: `₹${stats.totalCollection.toLocaleString()}`, label: 'Total Collection', change: '+8%', cardClass: 'card-purple' },
    { icon: <FiCheckCircle size={22} />, number: `₹${stats.paid.toLocaleString()}`, label: 'Amount Received', change: '+5%', cardClass: 'card-green' },
    { icon: <FiClock size={22} />, number: `₹${stats.pending.toLocaleString()}`, label: 'Pending Amount', change: '-3%', cardClass: 'card-rose' },
  ] : [];

  return (
    <div className="fade-in-up">
      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {statCards.map((stat, index) => (
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

      {/* Buttons */}
      <div className="dashboard-buttons">
        <button className="btn-primary-gradient" onClick={handleAddBill}>
          <FiPlus size={14} />
          Add New Bill
        </button>
        <button className="btn-primary-gradient pink" onClick={handleManageRooms}>
          <FiUsers size={14} />
          Manage Rooms
        </button>
        <button className="btn-ghost" onClick={handleHistory}>
          <FiFileText size={14} />
          History
        </button>
        <button className="btn-ghost" onClick={handleExport}>
          <FiDownload size={14} />
          Export
        </button>
      </div>

      {/* Table */}
      <RoomTable rooms={rooms} />
    </div>
  );
};

export default AdminDashboard;