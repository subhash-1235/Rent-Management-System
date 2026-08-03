import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Table, Row, Col } from 'react-bootstrap';
import { 
  FiPlus, 
  FiEye, 
  FiEdit, 
  FiTrash2, 
  FiRefreshCw,
  FiDollarSign,
  FiCalendar,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiMoreVertical,
  FiHome,
  FiUser,
  FiClock,
  FiTrendingUp,
  FiArrowLeft,
  FiFileText,
  FiInfo,
  FiCreditCard,
  FiLoader,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { billAPI, roomAPI, readingAPI, paymentAPI } from '../../services/api';
import './Bills.css';

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
const DeleteConfirmModal = ({ show, onHide, onConfirm, billMonth }) => {
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
        padding: '16px 24px',
        background: 'rgba(239, 68, 68, 0.05)'
      }}>
        <Modal.Title style={{ 
          color: '#F87171',
          fontSize: '18px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FiTrash2 size={20} style={{ color: '#F87171' }} />
          Delete Bill
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ 
        background: 'var(--bg-primary)',
        padding: '20px 24px'
      }}>
        <div className="delete-confirm-content">
          <div className="delete-confirm-icon">
            <FiAlertCircle size={40} style={{ color: '#FBBF24' }} />
          </div>
          <h4 style={{ 
            color: 'var(--text-primary)',
            fontWeight: 700,
            marginTop: '6px',
            fontSize: '17px'
          }}>
            Are you sure?
          </h4>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
            marginTop: '4px',
            marginBottom: '0'
          }}>
            You are about to delete the bill for <strong style={{ color: 'var(--text-primary)' }}>{billMonth}</strong>.
          </p>
          <div className="delete-warning-box">
            <FiAlertCircle size={16} style={{ color: '#F87171', flexShrink: 0 }} />
            <span style={{ fontSize: '13px' }}>
              This action cannot be undone. All room readings and payment data for this month will be permanently removed.
            </span>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer style={{ 
        borderTop: '1px solid var(--border-color)',
        padding: '12px 24px',
        background: 'var(--bg-glass)',
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        <Button 
          variant="secondary" 
          className="btn-ghost" 
          onClick={onHide}
          style={{ fontSize: '13px', padding: '6px 18px' }}
        >
          Cancel
        </Button>
        <Button 
          className="btn-delete-confirm" 
          onClick={handleConfirm}
          disabled={loading}
          style={{ fontSize: '13px', padding: '6px 18px' }}
        >
          {loading ? 'Deleting...' : 'Yes, Delete'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// ========================================
// PAYMENT MODAL - FIXED DECIMAL ISSUE
// ========================================
const PaymentModal = ({ show, onHide, reading, onPaymentComplete, isBulk = false, bulkData = null }) => {
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (reading) {
      const totalAmount = parseFloat(reading.total_amount) || 0;
      const paidAmount = parseFloat(reading.paid_amount) || 0;
      const remaining = totalAmount - paidAmount;
      setAmount(remaining.toFixed(2));
    }
    if (bulkData) {
      setAmount(bulkData.totalPending.toFixed(2));
    }
  }, [reading, bulkData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const paidAmount = parseFloat(amount);
      
      if (paidAmount <= 0) {
        setError('Amount must be greater than 0.');
        setLoading(false);
        return;
      }

      if (isBulk && bulkData) {
        const readings = bulkData.readings || [];
        let totalPaid = 0;
        
        for (const r of readings) {
          const remaining = (parseFloat(r.total_amount) || 0) - (parseFloat(r.paid_amount) || 0);
          if (remaining > 0) {
            await readingAPI.markPaid(r.id, { 
              payment_mode: paymentMode,
              amount: remaining
            });
            totalPaid += remaining;
          }
        }
        
        onPaymentComplete(totalPaid);
      } else if (reading) {
        const totalAmount = parseFloat(reading.total_amount) || 0;
        const alreadyPaid = parseFloat(reading.paid_amount) || 0;

        if (paidAmount > (totalAmount - alreadyPaid)) {
          setError('Amount cannot exceed remaining balance.');
          setLoading(false);
          return;
        }

        await readingAPI.markPaid(reading.id, { 
          payment_mode: paymentMode,
          amount: paidAmount
        });

        onPaymentComplete(paidAmount);
      }

      onHide();
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayInfo = () => {
    if (isBulk && bulkData) {
      return {
        title: `💰 Bulk Payment - ${bulkData.tenantName}`,
        tenant: bulkData.tenantName,
        room: bulkData.roomNumber,
        total: bulkData.totalPending,
        paid: 0,
        remaining: bulkData.totalPending
      };
    }
    
    if (reading) {
      const totalAmount = parseFloat(reading.total_amount) || 0;
      const alreadyPaid = parseFloat(reading.paid_amount) || 0;
      const remaining = totalAmount - alreadyPaid;
      const roomData = reading.room_details || reading.room || {};
      const roomNumber = roomData.room_number || 'N/A';
      const tenantName = reading.tenant_name_snapshot || roomData.tenant_name || '—';
      
      return {
        title: `💰 Payment - Room ${roomNumber}`,
        tenant: tenantName,
        room: roomNumber,
        total: totalAmount,
        paid: alreadyPaid,
        remaining: remaining
      };
    }
    
    return null;
  };

  const info = getDisplayInfo();
  if (!info) return null;

  const displayTotal = info.total.toFixed(2);
  const displayPaid = info.paid.toFixed(2);
  const displayRemaining = info.remaining.toFixed(2);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Modal.Title style={{ color: 'var(--text-primary)' }}>{info.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)' }}>
        {error && <CustomAlert type="error" message={error} onClose={() => setError(null)} />}
        <Form onSubmit={handleSubmit}>
          <div className="payment-info">
            <div className="payment-info-item">
              <span className="payment-info-label">Tenant</span>
              <span className="payment-info-value">{info.tenant}</span>
            </div>
            <div className="payment-info-item">
              <span className="payment-info-label">Room</span>
              <span className="payment-info-value">Room {info.room}</span>
            </div>
            {!isBulk && (
              <>
                <div className="payment-info-item">
                  <span className="payment-info-label">Total Amount</span>
                  <span className="payment-info-value" style={{ color: '#6C63FF', fontWeight: 700 }}>
                    ₹{displayTotal}
                  </span>
                </div>
                <div className="payment-info-item">
                  <span className="payment-info-label">Already Paid</span>
                  <span className="payment-info-value" style={{ color: '#34D399', fontWeight: 600 }}>
                    ₹{displayPaid}
                  </span>
                </div>
              </>
            )}
            <div className="payment-info-item">
              <span className="payment-info-label">{isBulk ? 'Total Pending' : 'Remaining'}</span>
              <span className="payment-info-value" style={{ color: '#F87171', fontWeight: 700 }}>
                ₹{displayRemaining}
              </span>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Payment Amount (₹)</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter amount"
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
              }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              max={info.remaining}
              step="any"
              inputMode="decimal"
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Max: ₹{displayRemaining}
            </small>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--text-secondary)' }}>Payment Mode</Form.Label>
            <Form.Select 
              className="form-control"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
              }}
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="CASH" style={{ backgroundColor: '#1A2234', color: '#FFFFFF' }}>Cash</option>
              <option value="UPI" style={{ backgroundColor: '#1A2234', color: '#FFFFFF' }}>UPI</option>
              <option value="QR" style={{ backgroundColor: '#1A2234', color: '#FFFFFF' }}>QR Code</option>
              <option value="BANK" style={{ backgroundColor: '#1A2234', color: '#FFFFFF' }}>Bank Transfer</option>
            </Form.Select>
          </Form.Group>

          <div className="d-flex gap-2 mt-3">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1 }}>
              {loading ? (
                <>
                  <FiLoader className="spinning" size={16} /> Processing...
                </>
              ) : (
                `Pay ₹${parseFloat(amount || 0).toFixed(2)}`
              )}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide}>Cancel</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// ========================================
// ADD BILL MODAL
// ========================================
const AddBillModal = ({ show, onHide, onBillAdded }) => {
  const [formData, setFormData] = useState({ month: '', per_unit_rate: '' });
  const [rooms, setRooms] = useState([]);
  const [readings, setReadings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show) {
      fetchRooms();
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, month }));
    }
  }, [show]);

  const fetchRooms = async () => {
    try {
      const response = await roomAPI.getActive();
      setRooms(response.data || []);
      const initialReadings = {};
      response.data.forEach(room => { initialReadings[room.id] = ''; });
      setReadings(initialReadings);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleReadingChange = (roomId, value) => {
    setReadings({ ...readings, [roomId]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const monthDate = `${formData.month}-01`;
      
      const billData = {
        month: monthDate,
        per_unit_rate: parseFloat(formData.per_unit_rate),
        total_bill_amount: 0,
        total_units: 0,
        is_closed: false
      };
      
      const billResponse = await billAPI.create(billData);
      const billId = billResponse.data.id;

      let hasReadings = false;
      for (const room of rooms) {
        const units = parseFloat(readings[room.id]);
        if (units && units > 0) {
          hasReadings = true;
          await readingAPI.create({
            room: room.id,
            monthly_bill: billId,
            units_consumed: units,
          });
        }
      }

      if (hasReadings) {
        await billAPI.calculate(billId);
      }

      onBillAdded();
      onHide();
      setFormData({ month: formData.month, per_unit_rate: '' });
      setReadings({});
    } catch (err) {
      console.error('Error adding bill:', err);
      if (err.response?.data?.month) {
        setError(`⚠️ Bill for ${formData.month} already exists! Please delete existing bill first.`);
      } else {
        setError(err.response?.data?.detail || 'Failed to add bill. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Modal.Title style={{ color: 'var(--text-primary)' }}>💰 Add New Bill</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--bg-primary)' }}>
        {error && <CustomAlert type="error" message={error} onClose={() => setError(null)} />}
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ color: 'var(--text-secondary)' }}>Month *</Form.Label>
                <Form.Control 
                  type="month" 
                  name="month" 
                  className="form-control"
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: 'var(--text-primary)',
                  }}
                  value={formData.month} 
                  onChange={handleChange} 
                  required 
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ color: 'var(--text-secondary)' }}>Per Unit Rate (₹) *</Form.Label>
                <Form.Control 
                  type="number" 
                  name="per_unit_rate" 
                  placeholder="Enter per unit rate"
                  className="form-control"
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: 'var(--text-primary)',
                  }}
                  value={formData.per_unit_rate} 
                  onChange={handleChange} 
                  required 
                  min="0" 
                  step="any"
                  inputMode="decimal"
                />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mt-3 mb-2" style={{ color: 'var(--text-secondary)' }}>Room Readings</h6>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {rooms.map((room) => (
              <Form.Group key={room.id} className="mb-2">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ minWidth: '120px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Room {room.room_number}
                  </div>
                  <Form.Control 
                    type="number" 
                    placeholder="Units consumed (e.g. 54.45)"
                    className="form-control"
                    style={{
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      color: 'var(--text-primary)',
                      width: '180px',
                    }}
                    value={readings[room.id] || ''} 
                    onChange={(e) => handleReadingChange(room.id, e.target.value)} 
                    min="0" 
                    step="any"
                    inputMode="decimal"
                  />
                </div>
              </Form.Group>
            ))}
          </div>

          <div className="d-flex gap-2 mt-3">
            <Button type="submit" className="btn-primary-gradient" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Adding...' : 'Add Bill'}
            </Button>
            <Button variant="secondary" className="btn-ghost" onClick={onHide}>Cancel</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// ========================================
// PENDING DUES SUMMARY - WITH MONTH COUNT
// ========================================
const PendingDuesSummary = ({ allBillDetails, onPayAll, onPayIndividual }) => {
  const [expandedTenants, setExpandedTenants] = useState({});
  
  const groupAllTenants = () => {
    const grouped = {};
    
    allBillDetails.forEach(reading => {
      const roomData = reading.room_details || reading.room || {};
      const tenantName = reading.tenant_name_snapshot || roomData.tenant_name || '—';
      
      if (tenantName === '—') return;
      
      const key = `${roomData.id || reading.room}_${tenantName}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          tenantName: tenantName,
          roomNumber: roomData.room_number || '?',
          roomId: roomData.id || reading.room,
          readings: [],
          totalPending: 0,
          monthWise: {},
          monthCount: 0
        };
      }
      
      const total = parseFloat(reading.total_amount) || 0;
      const paid = parseFloat(reading.paid_amount) || 0;
      const pending = total - paid;
      
      if (pending > 0) {
        const monthKey = reading.month || reading.monthly_bill_details?.month;
        const monthLabel = new Date(monthKey).toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        });
        
        grouped[key].readings.push({
          ...reading,
          monthLabel: monthLabel
        });
        grouped[key].monthWise[monthLabel] = pending;
        grouped[key].totalPending += pending;
      }
    });
    
    Object.values(grouped).forEach(tenant => {
      tenant.monthCount = Object.keys(tenant.monthWise).length;
    });
    
    return Object.values(grouped).filter(g => g.totalPending > 0);
  };

  const tenantData = groupAllTenants();
  tenantData.sort((a, b) => b.totalPending - a.totalPending);
  
  const toggleExpand = (tenantKey) => {
    setExpandedTenants(prev => ({
      ...prev,
      [tenantKey]: !prev[tenantKey]
    }));
  };

  if (tenantData.length === 0) {
    return (
      <div className="pending-dues-empty">
        <div className="empty-icon">✅</div>
        <div className="empty-title">No Pending Dues</div>
        <div className="empty-sub">All tenants have cleared their payments.</div>
      </div>
    );
  }

  return (
    <div className="pending-dues-wrapper">
      <div className="pending-dues-header">
        <h5 className="pending-dues-title">
          <FiClock size={18} /> Pending Dues Summary
        </h5>
        <span className="pending-dues-count">
          {tenantData.length} Tenant{tenantData.length > 1 ? 's' : ''} with dues
        </span>
      </div>
      
      <div className="table-responsive pending-dues-table">
        <table className="table-premium">
          <thead>
            <tr>
              <th className="col-sno">S.No</th>
              <th className="col-room">Room</th>
              <th className="col-tenant">Tenant</th>
              <th className="col-months">Months</th>
              <th className="col-pending">Total Pending</th>
              <th className="col-action">Action</th>
              <th className="col-expand"></th>
            </tr>
          </thead>
          <tbody>
            {tenantData.map((tenant, idx) => {
              const tenantKey = `${tenant.tenantName}_${tenant.roomNumber}`;
              const isExpanded = expandedTenants[tenantKey] || false;
              const monthLabels = Object.keys(tenant.monthWise).sort();
              
              return (
                <React.Fragment key={idx}>
                  <tr className="pending-dues-row" onClick={() => toggleExpand(tenantKey)}>
                    <td className="cell-sno">{idx + 1}</td>
                    <td className="cell-room">
                      <span className="room-tag">Room {tenant.roomNumber}</span>
                    </td>
                    <td className="cell-tenant">
                      <strong>{tenant.tenantName}</strong>
                    </td>
                    <td className="cell-months">
                      <span className={`month-badge ${tenant.monthCount > 1 ? 'multiple' : 'single'}`}>
                        {tenant.monthCount} {tenant.monthCount > 1 ? 'Months' : 'Month'}
                      </span>
                    </td>
                    <td className="cell-pending">
                      <span className="rupee">₹</span>{tenant.totalPending.toFixed(2)}
                    </td>
                    <td className="cell-action">
                      <button 
                        className="btn-pay-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPayAll(tenant);
                        }}
                      >
                        <FiCreditCard size={14} /> Pay All
                      </button>
                    </td>
                    <td className={`cell-expand ${isExpanded ? 'open' : ''}`}>
                      {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="expandable-row">
                      <td colSpan="7" className="expandable-cell">
                        <div className="expandable-content">
                          <div className="month-label">
                            <span>📅 Month-wise Pending Details ({tenant.monthCount} {tenant.monthCount > 1 ? 'Months' : 'Month'})</span>
                            <span className="line"></span>
                          </div>
                          <div className="month-grid">
                            {monthLabels.map(month => {
                              const amount = tenant.monthWise[month];
                              const reading = tenant.readings.find(r => r.monthLabel === month);
                              return (
                                <div key={month} className="month-card">
                                  <span className="m-name">{month}</span>
                                  <span className="m-amount">₹{amount.toFixed(2)}</span>
                                  <button 
                                    className="m-pay-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onPayIndividual(tenant, reading, amount);
                                    }}
                                  >
                                    Pay
                                  </button>
                                </div>
                              );
                            })}
                            <div className="month-card total">
                              <span className="m-name">Total</span>
                              <span className="m-amount">₹{tenant.totalPending.toFixed(2)}</span>
                              <button 
                                className="m-pay-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPayAll(tenant);
                                }}
                              >
                                Pay All
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ========================================
// BILLS MAIN COMPONENT
// ========================================
const Bills = () => {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billDetails, setBillDetails] = useState([]);
  const [allBillDetails, setAllBillDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);
  const [alert, setAlert] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetMonth, setDeleteTargetMonth] = useState('');
  const [isBulkPayment, setIsBulkPayment] = useState(false);
  const [bulkPaymentData, setBulkPaymentData] = useState(null);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    if (bills.length > 0) {
      const uniqueMonths = {};
      bills.forEach(bill => {
        const monthKey = bill.month;
        if (!uniqueMonths[monthKey]) {
          uniqueMonths[monthKey] = {
            value: bill.month,
            label: new Date(bill.month).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })
          };
        }
      });
      
      const months = Object.values(uniqueMonths);
      months.sort((a, b) => new Date(a.value) - new Date(b.value));
      setAvailableMonths(months);
      
      if (months.length > 0) {
        setSelectedMonth(months[months.length - 1].value);
      }
    }
  }, [bills]);

  useEffect(() => {
    if (selectedMonth) {
      fetchBillDetails(selectedMonth);
    }
  }, [selectedMonth]);

  useEffect(() => {
    const fetchAllBillDetails = async () => {
      try {
        const allDetails = [];
        for (const bill of bills) {
          const response = await readingAPI.getByMonth(bill.month);
          const readings = response.data || [];
          allDetails.push(...readings.map(r => ({
            ...r,
            month: bill.month
          })));
        }
        setAllBillDetails(allDetails);
      } catch (err) {
        console.error('Error fetching all bill details:', err);
      }
    };
    
    if (bills.length > 0) {
      fetchAllBillDetails();
    }
  }, [bills]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billAPI.getAll();
      setBills(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Failed to load bills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBillDetails = async (month) => {
    try {
      setDetailsLoading(true);
      const response = await readingAPI.getByMonth(month);
      setBillDetails(response.data || []);
      
      const bill = bills.find(b => b.month === month);
      setSelectedBill(bill || null);
    } catch (err) {
      console.error('Error fetching bill details:', err);
      showAlert('error', 'Failed to load bill details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleAlertClose = () => {
    setAlert(null);
  };

  const handleBillAdded = () => {
    fetchBills();
    showAlert('success', '✅ Bill added successfully!');
  };

  const handlePaymentClick = (reading) => {
    setSelectedReading(reading);
    setIsBulkPayment(false);
    setBulkPaymentData(null);
    setShowPaymentModal(true);
  };

  const handleBulkPayAll = (tenant) => {
    setBulkPaymentData({
      tenantName: tenant.tenantName,
      roomNumber: tenant.roomNumber,
      readings: tenant.readings,
      totalPending: tenant.totalPending
    });
    setIsBulkPayment(true);
    setSelectedReading(null);
    setShowPaymentModal(true);
  };

  const handleIndividualPay = (tenant, reading, amount) => {
    if (reading) {
      setSelectedReading(reading);
      setIsBulkPayment(false);
      setBulkPaymentData(null);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentComplete = (amount) => {
    fetchBillDetails(selectedMonth);
    fetchBills();
    showAlert('success', `✅ Payment of ₹${amount.toFixed(2)} processed successfully!`);
  };

  const handleCalculate = async (id) => {
    try {
      await billAPI.calculate(id);
      fetchBills();
      if (selectedMonth) {
        fetchBillDetails(selectedMonth);
      }
      showAlert('success', '✅ Bill calculated successfully!');
    } catch (err) {
      console.error('Error calculating bill:', err);
      showAlert('error', '❌ Failed to calculate bill. Please try again.');
    }
  };

  const handleDeleteClick = (id) => {
    const billToDelete = bills.find(b => b.id === id);
    if (!billToDelete) {
      showAlert('error', '❌ Bill not found.');
      return;
    }
    
    const monthLabel = new Date(billToDelete.month).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    setDeleteTargetId(id);
    setDeleteTargetMonth(monthLabel);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await billAPI.delete(deleteTargetId);
      await fetchBills();
      
      if (selectedBill && selectedBill.id === deleteTargetId) {
        setBillDetails([]);
        setSelectedBill(null);
        const remainingMonths = bills.filter(b => b.id !== deleteTargetId);
        if (remainingMonths.length > 0) {
          const sorted = remainingMonths.sort((a, b) => new Date(a.month) - new Date(b.month));
          setSelectedMonth(sorted[sorted.length - 1].month);
        } else {
          setSelectedMonth('');
        }
      }
      
      setShowDeleteModal(false);
      showAlert('success', `✅ Bill for ${deleteTargetMonth} deleted successfully!`);
    } catch (err) {
      console.error('Error deleting bill:', err);
      showAlert('error', '❌ Failed to delete bill. Please try again.');
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (isPaid, totalAmount, paidAmount) => {
    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    
    if (total === 0) {
      return { class: 'pending', label: '⏳ Pending' };
    }
    if (paid >= total) {
      return { class: 'paid', label: '✅ Paid' };
    }
    if (paid > 0 && paid < total) {
      return { class: 'partial', label: '🔄 Partial' };
    }
    return { class: 'pending', label: '⏳ Pending' };
  };

  const getTenantDisplayName = (reading) => {
    const roomData = reading.room_details || reading.room || {};
    
    if (reading.tenant_name_snapshot && reading.tenant_name_snapshot.trim() !== '') {
      return reading.tenant_name_snapshot;
    }
    
    if (roomData.tenant_name && roomData.tenant_name.trim() !== '') {
      return roomData.tenant_name;
    }
    
    return '—';
  };

  const totalAmount = billDetails.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);
  const totalPaid = billDetails.reduce((sum, r) => sum + (parseFloat(r.paid_amount) || 0), 0);
  const totalPending = totalAmount - totalPaid;

  const [overallPending, setOverallPending] = useState(0);

  useEffect(() => {
    const fetchOverallPending = async () => {
      try {
        const response = await billAPI.getAll();
        const allBills = response.data || [];
        let totalBillAmount = 0;
        let totalPaidAmount = 0;
        
        for (const bill of allBills) {
          const readingsRes = await readingAPI.getByMonth(bill.month);
          const readings = readingsRes.data || [];
          totalBillAmount += readings.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);
          totalPaidAmount += readings.reduce((sum, r) => sum + (parseFloat(r.paid_amount) || 0), 0);
        }
        
        setOverallPending(totalBillAmount - totalPaidAmount);
      } catch (err) {
        console.error('Error calculating overall pending:', err);
      }
    };
    
    fetchOverallPending();
  }, [bills]);

  const billStats = [
    { 
      icon: <FiDollarSign size={22} />, 
      number: `₹${formatAmount(totalAmount)}`, 
      label: 'This Month Total', 
      change: 'Current Month',
      cardClass: 'card-gold' 
    },
    { 
      icon: <FiCheck size={22} />, 
      number: `₹${formatAmount(totalPaid)}`, 
      label: 'This Month Received', 
      change: 'Current Month',
      cardClass: 'card-green' 
    },
    { 
      icon: <FiClock size={22} />, 
      number: `₹${formatAmount(overallPending)}`, 
      label: 'Overall Pending', 
      change: 'All Months',
      cardClass: 'card-rose' 
    },
    { 
      icon: <FiTrendingUp size={22} />, 
      number: `₹${formatAmount(totalPending)}`, 
      label: 'This Month Pending', 
      change: 'Current Month',
      cardClass: 'card-blue' 
    },
  ];

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading bills...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-4">{error}</Alert>;
  }

  return (
    <div className="fade-in-up">
      {alert && (
        <CustomAlert 
          type={alert.type} 
          message={alert.message} 
          onClose={handleAlertClose}
        />
      )}

      {/* 4 Cards */}
      <Row className="g-3 mb-4">
        {billStats.map((stat, index) => (
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

      {/* Month Selector & Actions */}
      <div className="month-selector-bar">
        <div className="month-selector">
          <FiCalendar className="month-selector-icon" />
          {availableMonths.length > 0 ? (
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-select"
            >
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="month-select-placeholder">No bills yet</span>
          )}
        </div>
        
        <div className="month-actions">
          <button className="btn-primary-gradient" onClick={() => setShowModal(true)}>
            <FiPlus size={16} /> Add New Bill
          </button>
          
          {selectedBill && availableMonths.length > 0 && (
            <>
              <button 
                className="btn-ghost btn-sm" 
                onClick={() => handleCalculate(selectedBill.id)}
                title="Calculate - This will save tenant name snapshots"
              >
                <FiRefreshCw size={14} /> Calculate & Save
              </button>
              <button 
                className="btn-ghost btn-sm delete-btn-sm" 
                onClick={() => handleDeleteClick(selectedBill.id)}
                title={`Delete ${new Date(selectedBill.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
              >
                <FiTrash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Room-wise Bill Table */}
      <div className="table-wrap">
        {detailsLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Loading details...</p>
          </div>
        ) : billDetails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No room readings found</div>
            <div className="empty-sub">
              {availableMonths.length > 0 
                ? 'This bill has no room readings yet.' 
                : 'Click "Add New Bill" to create your first bill.'}
            </div>
            {availableMonths.length === 0 && (
              <button 
                className="btn-primary-gradient mt-3" 
                onClick={() => setShowModal(true)}
              >
                <FiPlus size={16} /> Create First Bill
              </button>
            )}
          </div>
        ) : (
          <div className="bill-table-scroll">
            <table className="table-premium bill-table">
              <thead>
                <tr>
                  <th className="sno-col">#</th>
                  <th className="room-col">Room</th>
                  <th className="tenant-col">Tenant</th>
                  <th className="units-col">Units</th>
                  <th className="bill-col">Bill</th>
                  <th className="rent-col">Rent</th>
                  <th className="total-col">Total</th>
                  <th className="paid-col">Paid</th>
                  <th className="remaining-col">Remaining</th>
                  <th className="status-col">Status</th>
                  <th className="action-col">Action</th>
                </tr>
              </thead>
              <tbody>
                {billDetails.map((reading, index) => {
                  const roomData = reading.room_details || reading.room || {};
                  const roomNumber = roomData.room_number || '?';
                  const tenantName = getTenantDisplayName(reading);
                  
                  const rent = parseFloat(roomData.room_rent) || 0;
                  const total = parseFloat(reading.total_amount) || 0;
                  const paid = parseFloat(reading.paid_amount) || 0;
                  const remaining = total - paid;
                  const electricity = parseFloat(reading.electricity_charge) || 0;
                  const units = parseFloat(reading.units_consumed) || 0;
                  const status = getStatusBadge(reading.is_paid, total, paid);
                  
                  return (
                    <tr key={reading.id}>
                      <td className="sno-cell">{index + 1}</td>
                      <td className="room-cell"><strong>Room {roomNumber}</strong></td>
                      <td className="tenant-cell">{tenantName}</td>
                      <td className="units-cell">{units.toFixed(2)}</td>
                      <td className="bill-cell">₹{electricity.toFixed(2)}</td>
                      <td className="rent-cell">₹{rent.toFixed(2)}</td>
                      <td className="total-cell"><strong style={{ color: '#6C63FF' }}>₹{total.toFixed(2)}</strong></td>
                      <td className="paid-cell" style={{ color: '#34D399' }}>₹{paid.toFixed(2)}</td>
                      <td className="remaining-cell" style={{ color: remaining > 0 ? '#F87171' : '#34D399' }}>
                        ₹{remaining.toFixed(2)}
                      </td>
                      <td className="status-cell">
                        <span className={`badge-status ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="action-cell">
                        {remaining > 0 && (
                          <button 
                            className="action-btn edit-btn" 
                            title="Mark Paid" 
                            onClick={() => handlePaymentClick(reading)}
                          >
                            Pay ₹{remaining.toFixed(2)}
                          </button>
                        )}
                        {remaining === 0 && total > 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✓ Paid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Dues Summary - BOTTOM */}
      {allBillDetails.length > 0 && (
        <div className="pending-dues-section mt-4">
          <PendingDuesSummary 
            allBillDetails={allBillDetails}
            onPayAll={handleBulkPayAll}
            onPayIndividual={handleIndividualPay}
          />
        </div>
      )}

      <DeleteConfirmModal 
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        billMonth={deleteTargetMonth}
      />

      <PaymentModal 
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        reading={selectedReading}
        onPaymentComplete={handlePaymentComplete}
        isBulk={isBulkPayment}
        bulkData={bulkPaymentData}
      />

      <AddBillModal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        onBillAdded={handleBillAdded} 
      />
    </div>
  );
};

export default Bills;