// src/components/tenant/MyDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiDollarSign, 
  FiCheckCircle, 
  FiClock,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiTrendingUp
} from 'react-icons/fi';
import { tenantAPI } from '../../services/api';
import './MyDashboard.css';

const MyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenantData, setTenantData] = useState(null);
  const [billsData, setBillsData] = useState(null);
  const [currentBill, setCurrentBill] = useState(null);
  const [stats, setStats] = useState({
    totalBills: 0,
    totalPaid: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const profileRes = await tenantAPI.getProfile();
      setTenantData(profileRes.data);
      
      const billsRes = await tenantAPI.getBills();
      setBillsData(billsRes.data.bills || []);
      
      const bills = billsRes.data.bills || [];
      const summary = billsRes.data.summary || {};
      
      setStats({
        totalBills: summary.total_bills || 0,
        totalPaid: summary.total_paid || 0,
        totalPending: summary.total_pending || 0,
        paidCount: summary.paid_count || 0,
        pendingCount: summary.pending_count || 0,
      });
      
      const currentMonthBill = bills.find(b => !b.is_paid) || bills[0] || null;
      setCurrentBill(currentMonthBill);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching tenant dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getStatusBadge = (isPaid) => {
    if (isPaid) {
      return { class: 'paid', label: '✅ Paid' };
    }
    return { class: 'pending', label: '⏳ Pending' };
  };

  const handlePayBill = (billId) => {
    navigate('/tenant-payment', { state: { billId } });
  };

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
      <Alert variant="danger" className="mt-4" style={{ 
        background: 'rgba(248, 113, 113, 0.08)',
        border: '1px solid rgba(248, 113, 113, 0.1)',
        borderRadius: '10px',
        color: '#F87171'
      }}>
        {error}
        <button 
          className="btn-primary-gradient ms-3" 
          onClick={fetchDashboardData}
          style={{ padding: '4px 16px', fontSize: '12px' }}
        >
          Retry
        </button>
      </Alert>
    );
  }

  if (!tenantData) {
    return (
      <div className="text-center mt-5">
        <p className="text-muted">No tenant data found. Please contact admin.</p>
      </div>
    );
  }

  const statItems = [
    { 
      icon: <FiDollarSign size={22} />, 
      number: `₹${formatAmount(stats.totalBills)}`, 
      label: 'Total Bills', 
      change: 'Overall',
      cardClass: 'card-gold' 
    },
    { 
      icon: <FiCheckCircle size={22} />, 
      number: `₹${formatAmount(stats.totalPaid)}`, 
      label: 'Total Paid', 
      change: 'All Months',
      cardClass: 'card-green' 
    },
    { 
      icon: <FiClock size={22} />, 
      number: `₹${formatAmount(stats.totalPending)}`, 
      label: 'Total Pending', 
      change: 'Due Amount',
      cardClass: 'card-rose' 
    },
    { 
      icon: <FiTrendingUp size={22} />, 
      number: stats.pendingCount, 
      label: 'Pending Bills', 
      change: 'Due Count',
      cardClass: 'card-blue' 
    },
  ];

  return (
    <div className="fade-in-up tenant-dashboard">
      {/* Welcome Section */}
      <div className="tenant-welcome">
        <div>
          <h1 className="tenant-welcome-title">
            👋 Welcome, <span className="highlight">{tenantData.name}</span>
          </h1>
          <p className="tenant-welcome-sub">
            <FiMapPin size={16} style={{ marginRight: '4px' }} />
            Room {tenantData.room_number} • ₹{formatAmount(tenantData.room_rent)}/month
          </p>
        </div>
        <div className="tenant-profile-badge">
          <div className="tenant-avatar">
            {tenantData.name?.charAt(0) || 'T'}
          </div>
          <div className="tenant-badge-info">
            <div className="tenant-badge-name">{tenantData.name}</div>
            <div className="tenant-badge-role">Tenant</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {statItems.map((stat, index) => (
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

      {/* Current Bill Section */}
      <div className="table-wrap mb-4">
        <div className="table-header">
          <h6>📋 Current Month Bill</h6>
          <span className="room-count">
            {currentBill?.month || 'No bill'}
          </span>
        </div>
        
        {currentBill ? (
          <div className="current-bill-card">
            <Row>
              <Col md={6}>
                <div className="bill-detail-item">
                  <span className="bill-detail-label">Month</span>
                  <span className="bill-detail-value">{currentBill.month}</span>
                </div>
                <div className="bill-detail-item">
                  <span className="bill-detail-label">Room Rent</span>
                  <span className="bill-detail-value">₹{formatAmount(currentBill.room_rent)}</span>
                </div>
                <div className="bill-detail-item">
                  <span className="bill-detail-label">Electricity</span>
                  <span className="bill-detail-value">₹{formatAmount(currentBill.electricity_charge)}</span>
                </div>
                <div className="bill-detail-item">
                  <span className="bill-detail-label">Units Consumed</span>
                  <span className="bill-detail-value">{currentBill.units_consumed}</span>
                </div>
              </Col>
              <Col md={6} className="bill-summary-col">
                <div className="bill-total-box">
                  <div className="bill-total-amount">
                    ₹{formatAmount(currentBill.total_amount)}
                  </div>
                  <div className="bill-total-label">Total Amount</div>
                </div>
                <div className="bill-status-box">
                  <span className={`badge-status ${getStatusBadge(currentBill.is_paid).class}`}>
                    {getStatusBadge(currentBill.is_paid).label}
                  </span>
                  {!currentBill.is_paid && (
                    <button 
                      className="btn-pay-now"
                      onClick={() => handlePayBill(currentBill.id)}
                    >
                      Pay Now
                    </button>
                  )}
                  {currentBill.is_paid && (
                    <span className="paid-date-text">
                      Paid on {new Date(currentBill.paid_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No bills found</div>
            <div className="empty-sub">Your bills will appear here once generated.</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="quick-actions-title">Quick Actions</div>
        <div className="quick-actions-grid">
          <div 
            className="quick-action-card"
            onClick={() => navigate('/tenant-bills')}
          >
            <div className="quick-action-icon">📊</div>
            <div className="quick-action-label">My Bills</div>
          </div>
          <div 
            className="quick-action-card"
            onClick={() => navigate('/tenant-payment')}
          >
            <div className="quick-action-icon">💰</div>
            <div className="quick-action-label">Pay Bill</div>
          </div>
          <div 
            className="quick-action-card"
            onClick={() => navigate('/tenant-profile')}
          >
            <div className="quick-action-icon">👤</div>
            <div className="quick-action-label">My Profile</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDashboard;