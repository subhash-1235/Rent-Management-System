// src/components/tenant/MyBills.jsx

import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiSearch,
  FiFilter,
  FiArrowLeft,
  FiPlus
} from 'react-icons/fi';
import { tenantAPI } from '../../services/api';
import './MyBills.css';

const MyBills = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [summary, setSummary] = useState({
    total_bills: 0,
    total_paid: 0,
    total_pending: 0,
    paid_count: 0,
    pending_count: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillDetail, setShowBillDetail] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [bills, searchTerm, filterStatus]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.getBills();
      setBills(response.data.bills || []);
      setSummary(response.data.summary || {});
      setError(null);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Failed to load bills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    let filtered = [...bills];
    
    if (searchTerm) {
      filtered = filtered.filter(bill => 
        bill.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.month_key.includes(searchTerm)
      );
    }
    
    if (filterStatus === 'paid') {
      filtered = filtered.filter(bill => bill.is_paid);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(bill => !bill.is_paid);
    }
    
    setFilteredBills(filtered);
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

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setShowBillDetail(true);
  };

  const handleCloseDetail = () => {
    setShowBillDetail(false);
    setSelectedBill(null);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading bills...</p>
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
          onClick={fetchBills}
          style={{ padding: '4px 16px', fontSize: '12px' }}
        >
          Retry
        </button>
      </Alert>
    );
  }

  const statItems = [
    { 
      icon: <FiDollarSign size={20} />, 
      number: `₹${formatAmount(summary.total_bills)}`, 
      label: 'Total Bills', 
      cardClass: 'card-gold' 
    },
    { 
      icon: <FiCheckCircle size={20} />, 
      number: `₹${formatAmount(summary.total_paid)}`, 
      label: 'Total Paid', 
      cardClass: 'card-green' 
    },
    { 
      icon: <FiClock size={20} />, 
      number: `₹${formatAmount(summary.total_pending)}`, 
      label: 'Total Pending', 
      cardClass: 'card-rose' 
    },
    { 
      icon: <FiCalendar size={20} />, 
      number: summary.pending_count, 
      label: 'Pending Bills', 
      cardClass: 'card-blue' 
    },
  ];

  return (
    <div className="fade-in-up tenant-bills">
      {/* Header */}
      <div className="bills-header">
        <div>
          <h1 className="bills-title">📋 My Bills</h1>
          <p className="bills-subtitle">View all your bills and payment history</p>
        </div>
        <button 
          className="btn-primary-gradient"
          onClick={() => navigate('/tenant-dashboard')}
        >
          <FiArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {statItems.map((stat, index) => (
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

      {/* Search & Filter */}
      <div className="bills-search-filter">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by month (e.g., August 2026)"
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
            <option value="all">All Bills</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="table-wrap">
        <div className="table-header">
          <h6>📊 Bill History</h6>
          <span className="room-count">{filteredBills.length} bills</span>
        </div>
        
        {filteredBills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No bills found</div>
            <div className="empty-sub">
              {bills.length === 0 
                ? 'Your bills will appear here once generated.' 
                : 'No bills match your search criteria.'}
            </div>
          </div>
        ) : (
          <div className="bills-table-scroll">
            <table className="table-premium bills-table">
              <thead>
                <tr>
                  <th className="sno-col">#</th>
                  <th className="month-col">Month</th>
                  <th className="units-col">Units</th>
                  <th className="electricity-col">Electricity</th>
                  <th className="rent-col">Rent</th>
                  <th className="total-col">Total</th>
                  <th className="paid-col">Paid</th>
                  <th className="remaining-col">Remaining</th>
                  <th className="status-col">Status</th>
                  <th className="action-col">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill, index) => {
                  const status = getStatusBadge(bill.is_paid);
                  const remaining = bill.total_amount - bill.paid_amount;
                  
                  return (
                    <tr key={bill.id}>
                      <td className="sno-cell">{index + 1}</td>
                      <td className="month-cell">
                        <strong>{bill.month}</strong>
                      </td>
                      <td className="units-cell">{bill.units_consumed}</td>
                      <td className="electricity-cell">₹{formatAmount(bill.electricity_charge)}</td>
                      <td className="rent-cell">₹{formatAmount(bill.room_rent)}</td>
                      <td className="total-cell">
                        <strong>₹{formatAmount(bill.total_amount)}</strong>
                      </td>
                      <td className="paid-cell" style={{ color: '#34D399' }}>
                        ₹{formatAmount(bill.paid_amount)}
                      </td>
                      <td className="remaining-cell" style={{ 
                        color: remaining > 0 ? '#F87171' : '#34D399',
                        fontWeight: remaining > 0 ? 700 : 500
                      }}>
                        ₹{formatAmount(remaining)}
                      </td>
                      <td className="status-cell">
                        <span className={`badge-status ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="action-cell">
                        <div className="action-buttons">
                          {!bill.is_paid && (
                            <button 
                              className="action-btn pay-btn"
                              onClick={() => handlePayBill(bill.id)}
                              title="Pay Bill"
                            >
                              <FiDollarSign size={16} />
                              Pay
                            </button>
                          )}
                          <button 
                            className="action-btn view-btn"
                            onClick={() => handleViewBill(bill)}
                            title="View Details"
                          >
                            <FiEye size={16} />
                          </button>
                          {bill.is_paid && (
                            <span className="paid-label">✅</span>
                          )}
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

      {/* Bill Detail Modal */}
      {showBillDetail && selectedBill && (
        <div className="bill-detail-modal-overlay" onClick={handleCloseDetail}>
          <div className="bill-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bill-detail-header">
              <h3>📄 Bill Details</h3>
              <button className="modal-close-btn" onClick={handleCloseDetail}>×</button>
            </div>
            <div className="bill-detail-body">
              <div className="bill-detail-row">
                <span className="bill-detail-label">Month</span>
                <span className="bill-detail-value">{selectedBill.month}</span>
              </div>
              <div className="bill-detail-row">
                <span className="bill-detail-label">Units Consumed</span>
                <span className="bill-detail-value">{selectedBill.units_consumed}</span>
              </div>
              <div className="bill-detail-row">
                <span className="bill-detail-label">Electricity Charge</span>
                <span className="bill-detail-value">₹{formatAmount(selectedBill.electricity_charge)}</span>
              </div>
              <div className="bill-detail-row">
                <span className="bill-detail-label">Room Rent</span>
                <span className="bill-detail-value">₹{formatAmount(selectedBill.room_rent)}</span>
              </div>
              <div className="bill-detail-row total">
                <span className="bill-detail-label">Total Amount</span>
                <span className="bill-detail-value">₹{formatAmount(selectedBill.total_amount)}</span>
              </div>
              <div className="bill-detail-row">
                <span className="bill-detail-label">Paid Amount</span>
                <span className="bill-detail-value" style={{ color: '#34D399' }}>
                  ₹{formatAmount(selectedBill.paid_amount)}
                </span>
              </div>
              <div className="bill-detail-row">
                <span className="bill-detail-label">Remaining</span>
                <span className="bill-detail-value" style={{ 
                  color: selectedBill.total_amount - selectedBill.paid_amount > 0 ? '#F87171' : '#34D399'
                }}>
                  ₹{formatAmount(selectedBill.total_amount - selectedBill.paid_amount)}
                </span>
              </div>
              <div className="bill-detail-row">
                <span className="bill-detail-label">Status</span>
                <span className={`badge-status ${getStatusBadge(selectedBill.is_paid).class}`}>
                  {getStatusBadge(selectedBill.is_paid).label}
                </span>
              </div>
              {selectedBill.paid_date && (
                <div className="bill-detail-row">
                  <span className="bill-detail-label">Paid Date</span>
                  <span className="bill-detail-value">
                    {new Date(selectedBill.paid_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {selectedBill.payment_mode && (
                <div className="bill-detail-row">
                  <span className="bill-detail-label">Payment Mode</span>
                  <span className="bill-detail-value">{selectedBill.payment_mode}</span>
                </div>
              )}
            </div>
            <div className="bill-detail-footer">
              {!selectedBill.is_paid && (
                <button 
                  className="btn-pay-now"
                  onClick={() => {
                    handleCloseDetail();
                    handlePayBill(selectedBill.id);
                  }}
                >
                  <FiDollarSign size={18} />
                  Pay Now
                </button>
              )}
              <button className="btn-close-modal" onClick={handleCloseDetail}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBills;