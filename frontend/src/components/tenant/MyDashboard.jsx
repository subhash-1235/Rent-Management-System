// src/components/tenant/MyDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FiDollarSign, 
  FiCheckCircle, 
  FiClock, 
  FiFileText,
  FiHome,
  FiCreditCard,
  FiUser,
  FiCalendar,
  FiZap,
  FiAlertTriangle,
  FiChevronRight,
  FiArrowRight,
  FiRefreshCw,
  FiTrendingUp
} from 'react-icons/fi';
import { tenantAPI } from '../../services/api';
import './MyDashboard.css';

const MyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenantData, setTenantData] = useState(null);
  const [billsData, setBillsData] = useState([]);
  const [currentBill, setCurrentBill] = useState(null);
  const [pendingDues, setPendingDues] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [showAllPending, setShowAllPending] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  
  const [stats, setStats] = useState({
    totalBills: 0,
    totalPaid: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0,
    previousPending: 0,
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
      const bills = billsRes.data.bills || [];
      setBillsData(bills);
      
      const summary = billsRes.data.summary || {};
      
      const currentMonthBill = bills.find(b => !b.is_paid) || bills[0] || null;
      setCurrentBill(currentMonthBill);
      
      const previousPending = bills.filter(b => !b.is_paid && b.month !== currentMonthBill?.month);
      setPendingDues(previousPending);
      
      const paidBills = bills.filter(b => b.is_paid).slice(0, 5);
      setRecentPayments(paidBills);
      
      const totalPending = summary.total_pending || 0;
      const previousPendingTotal = previousPending.reduce((sum, b) => sum + b.remaining, 0);
      
      setStats({
        totalBills: summary.total_bills || 0,
        totalPaid: summary.total_paid || 0,
        totalPending: totalPending,
        paidCount: summary.paid_count || 0,
        pendingCount: summary.pending_count || 0,
        previousPending: previousPendingTotal,
      });
      
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

  const handlePayAll = () => {
    navigate('/tenant-payment', { state: { payAll: true } });
  };

  const getNextDueDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffDays = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
    return { date: nextMonth, days: diffDays };
  };

  const nextDue = getNextDueDate();

  // 🔥 Format month to DD/MM/YYYY
  const formatMonth = (monthStr) => {
    try {
      const date = new Date(monthStr);
      if (isNaN(date.getTime())) return monthStr;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return monthStr;
    }
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
      <Alert variant="danger" className="mt-4">
        {error}
        <button className="btn btn-link" onClick={fetchDashboardData}>Retry</button>
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
      icon: <FiDollarSign size={20} />, 
      value: `₹${formatAmount(stats.totalBills)}`, 
      label: 'Total Bills',
      cardClass: 'stat-gold'
    },
    { 
      icon: <FiCheckCircle size={20} />, 
      value: `₹${formatAmount(stats.totalPaid)}`, 
      label: 'Total Paid',
      cardClass: 'stat-green'
    },
    { 
      icon: <FiClock size={20} />, 
      value: `₹${formatAmount(stats.totalPending)}`, 
      label: 'Total Pending',
      cardClass: 'stat-red'
    },
    { 
      icon: <FiFileText size={20} />, 
      value: stats.pendingCount, 
      label: 'Pending Bills',
      cardClass: 'stat-blue'
    },
  ];

  return (
    <div className="tenant-dashboard-new">
      {/* TOP BAR */}
      <div className="dashboard-top-bar">
        <div className="dashboard-greeting">
          <span className="greeting-emoji">👋</span>
          <div>
            <h1 className="dashboard-greeting-title">
              Hello, <span className="greeting-name">{tenantData.name}</span>
            </h1>
            <p className="dashboard-greeting-sub">Welcome back! Here's your rent summary</p>
          </div>
        </div>
        <div className="dashboard-top-right">
          <div className="room-badge"><FiHome size={16} /> Room {tenantData.room_number}</div>
          <div className="rent-badge"><FiZap size={16} /> ₹{formatAmount(tenantData.room_rent)}/month</div>
        </div>
      </div>

      {/* STATS */}
      <Row className="g-3 mb-4">
        {statItems.map((stat, index) => (
          <Col md={3} sm={6} xs={6} key={index}>
            <div className={`stat-card-new ${stat.cardClass}`}>
              <div className="stat-icon-new">{stat.icon}</div>
              <div className="stat-info-new">
                <div className="stat-value-new">{stat.value}</div>
                <div className="stat-label-new">{stat.label}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* DUE DATE + PENDING ALERT */}
      <Row className="g-3 mb-3">
        <Col md={6}>
          <div className="due-date-card-new">
            <div className="due-date-left">
              <FiCalendar size={20} className="due-date-icon" />
              <div>
                <div className="due-date-label">Next Rent Due</div>
                <div className="due-date-value">
                  {nextDue.date.toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </div>
            <div className="due-date-right">{nextDue.days} days left</div>
          </div>
        </Col>
        <Col md={6}>
          {stats.previousPending > 0 ? (
            <div className="pending-alert-new">
              <FiAlertTriangle size={20} className="pending-alert-icon" />
              <div className="pending-alert-content">
                <div className="pending-alert-title">Pending Dues!</div>
                <div className="pending-alert-detail">
                  ₹{formatAmount(stats.previousPending)} from {pendingDues.length} months
                </div>
              </div>
              <button className="pending-alert-btn" onClick={handlePayAll}>
                Pay All <FiChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="all-clear-alert">
              <span className="all-clear-icon">🎉</span>
              <div>
                <div className="all-clear-title">All Clear!</div>
                <div className="all-clear-detail">No pending dues</div>
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* ====== PENDING DUES TABLE ====== */}
      <div className="dues-table-card">
        <div className="dues-table-header">
          <div className="dues-table-title">
            <FiFileText size={18} />
            <span>Pending Dues Summary</span>
          </div>
          <span className="dues-table-count">{billsData.length} bills</span>
        </div>
        <div className="dues-table-body">
          <Table responsive className="dues-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Rent</th>
                <th>Electricity</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {billsData.length > 0 ? (
                billsData.map((bill) => (
                  <tr key={bill.id}>
                    <td className="dues-month">{formatMonth(bill.month)}</td>
                    <td className="dues-amount">₹{formatAmount(bill.room_rent)}</td>
                    <td className="dues-amount">₹{formatAmount(bill.electricity_charge)}</td>
                    <td className="dues-amount">₹{formatAmount(bill.total_amount)}</td>
                    <td className="dues-amount">₹{formatAmount(bill.paid_amount)}</td>
                    <td className="dues-pending-amount">₹{formatAmount(bill.remaining)}</td>
                    <td>
                      <span className={`badge-status-new ${getStatusBadge(bill.is_paid).class}`}>
                        {getStatusBadge(bill.is_paid).label}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No bills found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* RECENT PAYMENTS */}
      {recentPayments.length > 0 && (
        <div className="recent-payments-new">
          <div className="recent-payments-header">
            <div className="recent-payments-title">
              <FiTrendingUp size={18} />
              <span>Recent Payments</span>
            </div>
            <button 
              className="recent-view-all" 
              onClick={() => setShowPaymentHistory(!showPaymentHistory)}
            >
              {showPaymentHistory ? 'Show Less' : 'View All'} 
              <FiArrowRight size={14} />
            </button>
          </div>
          <div className="recent-payments-list">
            {(showPaymentHistory ? recentPayments : recentPayments.slice(0, 3)).map((p) => (
              <div key={p.id} className="recent-payment-item">
                <div className="recent-payment-left">
                  <span className="recent-payment-month">{formatMonth(p.month)}</span>
                  <span className="recent-payment-date">
                    {p.paid_date ? new Date(p.paid_date).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short' 
                    }) : 'N/A'}
                  </span>
                </div>
                <span className="recent-payment-amount">₹{formatAmount(p.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="dashboard-footer">
        <span>🏠 RentFlow v2.0</span>
        <span>•</span>
        <span>🔒 Secured</span>
        <span>•</span>
        <span>Support: 24/7</span>
      </div>
    </div>
  );
};

export default MyDashboard;