// src/components/tenant/MyBills.jsx

import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert, Form, Button } from 'react-bootstrap';
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
  FiPlus,
  FiTrash2,
  FiEdit,
  FiSave,
  FiX,
  FiZap,
  FiHome,
  FiTrendingUp
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
  const [showAddBill, setShowAddBill] = useState(false);
  
  // Bill Entry Form State
  const [billForm, setBillForm] = useState({
    month: '',
    units_consumed: '',
    per_unit_rate: '',
    room_rent: '',
    electricity_charge: 0,
    total_amount: 0,
  });
  
  const [tenantData, setTenantData] = useState(null);
  const [editingBillId, setEditingBillId] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterBills();
  }, [bills, searchTerm, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const profileRes = await tenantAPI.getProfile();
      setTenantData(profileRes.data);
      
      if (profileRes.data.room_rent) {
        setBillForm(prev => ({
          ...prev,
          room_rent: profileRes.data.room_rent
        }));
      }
      
      const response = await tenantAPI.getBills();
      setBills(response.data.bills || []);
      setSummary(response.data.summary || {});
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    let filtered = [...bills];
    
    if (searchTerm) {
      filtered = filtered.filter(bill => 
        bill.month.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus === 'paid') {
      filtered = filtered.filter(bill => bill.is_paid);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(bill => !bill.is_paid);
    }
    
    setFilteredBills(filtered);
  };

  const calculateBill = () => {
    const units = parseFloat(billForm.units_consumed) || 0;
    const rate = parseFloat(billForm.per_unit_rate) || 0;
    const rent = parseFloat(billForm.room_rent) || 0;
    
    const electricity = units * rate;
    const total = rent + electricity;
    
    setBillForm(prev => ({
      ...prev,
      electricity_charge: electricity,
      total_amount: total,
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setBillForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'units_consumed' || name === 'per_unit_rate') {
      setTimeout(calculateBill, 100);
    }
  };

  const handleSaveBill = async () => {
    if (!billForm.month) {
      setError('Please select a month');
      return;
    }
    
    if (!billForm.units_consumed || parseFloat(billForm.units_consumed) <= 0) {
      setError('Please enter valid units consumed');
      return;
    }
    
    if (!billForm.per_unit_rate || parseFloat(billForm.per_unit_rate) <= 0) {
      setError('Please enter per unit rate');
      return;
    }
    
    try {
      setLoading(true);
      
      const billData = {
        month: billForm.month,
        units_consumed: parseFloat(billForm.units_consumed),
        per_unit_rate: parseFloat(billForm.per_unit_rate),
        room_rent: parseFloat(billForm.room_rent),
        electricity_charge: billForm.electricity_charge,
        total_amount: billForm.total_amount,
        is_paid: false,
        paid_amount: 0,
      };
      
      let response;
      if (editingBillId) {
        response = await tenantAPI.updateBill(editingBillId, billData);
      } else {
        response = await tenantAPI.addBill(billData);
      }
      
      await fetchData();
      resetForm();
      setShowAddBill(false);
      setError(null);
      
    } catch (err) {
      console.error('Error saving bill:', err);
      setError(err.response?.data?.error || 'Failed to save bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBillForm({
      month: '',
      units_consumed: '',
      per_unit_rate: '',
      room_rent: tenantData?.room_rent || '',
      electricity_charge: 0,
      total_amount: 0,
    });
    setEditingBillId(null);
    setError(null);
  };

  const handleEditBill = (bill) => {
    setBillForm({
      month: bill.month,
      units_consumed: bill.units_consumed,
      per_unit_rate: bill.per_unit_rate || 0,
      room_rent: bill.room_rent,
      electricity_charge: bill.electricity_charge,
      total_amount: bill.total_amount,
    });
    setEditingBillId(bill.id);
    setShowAddBill(true);
    setShowBillDetail(false);
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    
    try {
      setLoading(true);
      await tenantAPI.deleteBill(billId);
      await fetchData();
    } catch (err) {
      console.error('Error deleting bill:', err);
      setError('Failed to delete bill. Please try again.');
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

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setShowBillDetail(true);
  };

  const handleCloseDetail = () => {
    setShowBillDetail(false);
    setSelectedBill(null);
  };

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      options.push({ value, label });
    }
    return options;
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading bills...</p>
      </div>
    );
  }

  if (error && !showAddBill) {
    return (
      <Alert variant="danger" className="mt-4 error-alert">
        {error}
        <button className="error-retry-btn" onClick={fetchData}>Retry</button>
      </Alert>
    );
  }

  const statItems = [
    { 
      icon: <FiDollarSign size={20} />, 
      number: `₹${formatAmount(summary.total_bills)}`, 
      label: 'Total Bills',
      cardClass: 'stat-gold'
    },
    { 
      icon: <FiCheckCircle size={20} />, 
      number: `₹${formatAmount(summary.total_paid)}`, 
      label: 'Total Paid',
      cardClass: 'stat-green'
    },
    { 
      icon: <FiClock size={20} />, 
      number: `₹${formatAmount(summary.total_pending)}`, 
      label: 'Total Pending',
      cardClass: 'stat-red'
    },
    { 
      icon: <FiCalendar size={20} />, 
      number: summary.pending_count, 
      label: 'Pending Bills',
      cardClass: 'stat-blue'
    },
  ];

  return (
    <div className="tenant-bills fade-in-up">
      {/* ===== HEADER ===== */}
      <div className="bills-header">
        <div>
          <h1 className="bills-title">📋 My Bills</h1>
          <p className="bills-subtitle">Add your monthly bills and track payments</p>
        </div>
        
        {/* 🔥 ADD BILL BUTTON - VISIBLE NOW */}
        <div className="bills-header-actions">
          <button 
            className="btn-add-bill"
            onClick={() => {
              resetForm();
              setShowAddBill(!showAddBill);
            }}
          >
            <FiPlus size={18} />
            {showAddBill ? 'Close Form' : 'Add Bill'}
          </button>
          <button 
            className="btn-back-dashboard"
            onClick={() => navigate('/tenant-dashboard')}
          >
            <FiArrowLeft size={16} />
            Dashboard
          </button>
        </div>
      </div>

      {/* ===== STATS ===== */}
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

      {/* ===== ADD BILL FORM ===== */}
      {showAddBill && (
        <div className="add-bill-form-card">
          <div className="add-bill-form-header">
            <h6>
              {editingBillId ? '✏️ Edit Bill' : '➕ Add New Bill'}
            </h6>
            <button className="form-close-btn" onClick={() => setShowAddBill(false)}>
              <FiX size={20} />
            </button>
          </div>
          <div className="add-bill-form-body">
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Month <span className="required">*</span></Form.Label>
                  <Form.Select
                    name="month"
                    value={billForm.month}
                    onChange={handleFormChange}
                    className="form-control-premium"
                  >
                    <option value="">Select Month</option>
                    {getMonthOptions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Units Consumed <span className="required">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="units_consumed"
                    placeholder="e.g., 150"
                    value={billForm.units_consumed}
                    onChange={handleFormChange}
                    className="form-control-premium"
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Per Unit Rate (₹) <span className="required">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="per_unit_rate"
                    placeholder="e.g., 8.50"
                    value={billForm.per_unit_rate}
                    onChange={handleFormChange}
                    className="form-control-premium"
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mt-2">
              <Col md={3}>
                <div className="bill-preview-item">
                  <span className="preview-label">Room Rent</span>
                  <span className="preview-value">₹{formatAmount(billForm.room_rent)}</span>
                </div>
              </Col>
              <Col md={3}>
                <div className="bill-preview-item">
                  <span className="preview-label">Electricity</span>
                  <span className="preview-value">₹{formatAmount(billForm.electricity_charge)}</span>
                </div>
              </Col>
              <Col md={3}>
                <div className="bill-preview-item highlight">
                  <span className="preview-label">Total Amount</span>
                  <span className="preview-value total">₹{formatAmount(billForm.total_amount)}</span>
                </div>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button 
                  className="btn-calculate"
                  onClick={calculateBill}
                  variant="outline-primary"
                >
                  <FiTrendingUp size={16} />
                  Calculate
                </Button>
              </Col>
            </Row>

            {error && (
              <div className="form-error mt-3">{error}</div>
            )}

            <div className="add-bill-form-footer">
              <button 
                className="btn-save-bill"
                onClick={handleSaveBill}
                disabled={loading}
              >
                <FiSave size={18} />
                {loading ? 'Saving...' : editingBillId ? 'Update Bill' : 'Save Bill'}
              </button>
              <button 
                className="btn-cancel-form"
                onClick={() => {
                  resetForm();
                  setShowAddBill(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SEARCH & FILTER ===== */}
      <div className="bills-search-filter">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by month..."
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

      {/* ===== TABLE ===== */}
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
                ? 'Click "Add Bill" to add your first bill.' 
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
                  <th className="rate-col">Rate</th>
                  <th className="rent-col">Rent</th>
                  <th className="electricity-col">Electricity</th>
                  <th className="total-col">Total</th>
                  <th className="paid-col">Paid</th>
                  <th className="remaining-col">Pending</th>
                  <th className="status-col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill, index) => {
                  const status = getStatusBadge(bill.is_paid);
                  const remaining = bill.total_amount - bill.paid_amount;
                  
                  return (
                    <tr key={bill.id} onClick={() => handleViewBill(bill)} style={{ cursor: 'pointer' }}>
                      <td className="sno-cell">{index + 1}</td>
                      <td className="month-cell">
                        <strong>{bill.month}</strong>
                      </td>
                      <td className="units-cell">{bill.units_consumed}</td>
                      <td className="rate-cell">₹{formatAmount(bill.per_unit_rate)}</td>
                      <td className="rent-cell">₹{formatAmount(bill.room_rent)}</td>
                      <td className="electricity-cell">₹{formatAmount(bill.electricity_charge)}</td>
                      <td className="total-cell">
                        <strong>₹{formatAmount(bill.total_amount)}</strong>
                      </td>
                      <td className="paid-cell">₹{formatAmount(bill.paid_amount)}</td>
                      <td className="remaining-cell" style={{ 
                        color: remaining > 0 ? '#EF4444' : '#34D399',
                        fontWeight: remaining > 0 ? 700 : 500
                      }}>
                        ₹{formatAmount(remaining)}
                      </td>
                      <td className="status-cell">
                        <span className={`badge-status ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== MODAL ===== */}
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
                <span className="bill-detail-label">Per Unit Rate</span>
                <span className="bill-detail-value">₹{formatAmount(selectedBill.per_unit_rate)}</span>
              </div>
              <div className="bill-detail-row">
                <span className="bill-detail-label">Room Rent</span>
                <span className="bill-detail-value">₹{formatAmount(selectedBill.room_rent)}</span>
              </div>
              <div className="bill-detail-row">
                <span className="bill-detail-label">Electricity Charge</span>
                <span className="bill-detail-value">₹{formatAmount(selectedBill.electricity_charge)}</span>
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
                <span className="bill-detail-label">Pending</span>
                <span className="bill-detail-value" style={{ 
                  color: selectedBill.total_amount - selectedBill.paid_amount > 0 ? '#EF4444' : '#34D399'
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
            </div>
            <div className="bill-detail-footer">
              {!selectedBill.is_paid && (
                <button 
                  className="btn-pay-now"
                  onClick={() => {
                    handleCloseDetail();
                    navigate('/tenant-payment', { state: { billId: selectedBill.id } });
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