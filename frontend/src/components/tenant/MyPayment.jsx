// src/components/tenant/MyPayment.jsx

import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiDollarSign, 
  FiArrowLeft, 
  FiCheckCircle,
  FiCreditCard,
  FiSmartphone,
  FiImage,
  FiHome,          // 🔥 Instead of FiBank
  FiDollarSign as FiCashIcon,  // 🔥 Instead of FiCash
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';
import { tenantAPI } from '../../services/api';
import './MyPayment.css';

const MyPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [bill, setBill] = useState(null);
  const [billId, setBillId] = useState(null);
  const [bills, setBills] = useState([]);
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_mode: 'UPI',
    transaction_id: '',
    remarks: '',
  });
  
  const [qrSettings, setQrSettings] = useState(null);

  useEffect(() => {
    const stateBillId = location.state?.billId;
    if (stateBillId) {
      setBillId(stateBillId);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const billsResponse = await tenantAPI.getBills();
      setBills(billsResponse.data.bills || []);
      
      try {
        const qrResponse = await fetch('http://localhost:8000/api/qr-settings/');
        const qrData = await qrResponse.json();
        if (qrData.length > 0) {
          setQrSettings(qrData[0]);
        }
      } catch (err) {
        console.log('QR settings not available');
      }
      
      if (billId) {
        const foundBill = billsResponse.data.bills?.find(b => b.id === billId);
        if (foundBill) {
          setBill(foundBill);
          setPaymentData(prev => ({
            ...prev,
            amount: foundBill.total_amount - foundBill.paid_amount
          }));
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load payment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  const handleBillSelect = (e) => {
    const value = e.target.value;
    if (!value) {
      setBill(null);
      return;
    }
    
    const id = parseInt(value, 10);
    if (isNaN(id)) {
      setBill(null);
      return;
    }
    
    const selected = bills.find(b => b.id === id);
    setBill(selected);
    if (selected) {
      const remaining = selected.total_amount - selected.paid_amount;
      setPaymentData(prev => ({
        ...prev,
        amount: remaining > 0 ? remaining : 0
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const amount = parseFloat(paymentData.amount);
    if (!bill) {
      setError('Please select a bill to pay.');
      return;
    }
    if (amount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    if (amount > (bill.total_amount - bill.paid_amount)) {
      setError(`Amount cannot exceed remaining balance of ₹${(bill.total_amount - bill.paid_amount).toFixed(2)}`);
      return;
    }
    
    setProcessing(true);
    
    try {
      const response = await tenantAPI.payBill({
        reading_id: bill.id,
        amount: amount,
        payment_mode: paymentData.payment_mode,
        transaction_id: paymentData.transaction_id || `TXN${Date.now()}`,
        remarks: paymentData.remarks || 'Paid by tenant',
      });
      
      if (response.data) {
        setSuccess({
          message: 'Payment successful!',
          amount: response.data.paid_amount,
          remaining: response.data.remaining,
          is_paid: response.data.is_paid,
          payment: response.data.payment
        });
        
        setPaymentData(prev => ({
          ...prev,
          transaction_id: '',
          remarks: '',
        }));
        
        setTimeout(() => {
          fetchData();
        }, 2000);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // 🔥 FIXED: Correct icon names
  const paymentModes = [
    { value: 'UPI', label: 'UPI', icon: <FiSmartphone size={18} /> },
    { value: 'QR', label: 'QR Code', icon: <FiImage size={18} /> },
    { value: 'CASH', label: 'Cash', icon: <FiDollarSign size={18} /> },  // 🔥 FiDollarSign for Cash
    { value: 'BANK', label: 'Bank Transfer', icon: <FiHome size={18} /> }, // 🔥 FiHome for Bank
  ];

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading payment details...</p>
      </div>
    );
  }

  const pendingBills = bills.filter(b => !b.is_paid);

  return (
    <div className="fade-in-up tenant-payment">
      {/* Header */}
      <div className="payment-header">
        <div>
          <h1 className="payment-title">💰 Make Payment</h1>
          <p className="payment-subtitle">Pay your rent and bills securely</p>
        </div>
        <button 
          className="btn-primary-gradient"
          onClick={() => navigate('/tenant-bills')}
        >
          <FiArrowLeft size={16} />
          Back to Bills
        </button>
      </div>

      {error && (
        <Alert variant="danger" className="payment-alert">
          <FiAlertCircle size={16} />
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="payment-alert success">
          <FiCheckCircle size={16} />
          <div>
            <strong>Payment successful!</strong>
            <br />
            Amount paid: ₹{formatAmount(success.amount)}
            {success.remaining > 0 && (
              <span> • Remaining: ₹{formatAmount(success.remaining)}</span>
            )}
            {success.is_paid && <span> • Bill fully paid ✅</span>}
          </div>
        </Alert>
      )}

      <Row className="g-4">
        {/* Payment Form */}
        <Col lg={7}>
          <div className="payment-card">
            <h5 className="payment-card-title">
              <FiCreditCard size={18} />
              Payment Details
            </h5>
            
            <Form onSubmit={handleSubmit}>
              {/* Bill Selection */}
              <Form.Group className="mb-3">
                <Form.Label>Select Bill</Form.Label>
                <Form.Select
                  value={bill?.id || ''}
                  onChange={handleBillSelect}
                  className="payment-select"
                  required
                >
                  <option value="">Select a bill to pay</option>
                  {pendingBills.length === 0 ? (
                    <option value="" disabled>No pending bills</option>
                  ) : (
                    pendingBills.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.month} - ₹{formatAmount(b.total_amount - b.paid_amount)} remaining
                      </option>
                    ))
                  )}
                </Form.Select>
              </Form.Group>

              {/* Bill Summary */}
              {bill && (
                <div className="bill-summary">
                  <div className="bill-summary-row">
                    <span>Month</span>
                    <span><strong>{bill.month}</strong></span>
                  </div>
                  <div className="bill-summary-row">
                    <span>Total Amount</span>
                    <span>₹{formatAmount(bill.total_amount)}</span>
                  </div>
                  <div className="bill-summary-row">
                    <span>Already Paid</span>
                    <span style={{ color: '#34D399' }}>₹{formatAmount(bill.paid_amount)}</span>
                  </div>
                  <div className="bill-summary-row total">
                    <span>Remaining Balance</span>
                    <span style={{ color: '#F87171', fontWeight: 700 }}>
                      ₹{formatAmount(bill.total_amount - bill.paid_amount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Amount */}
              <Form.Group className="mb-3">
                <Form.Label>Payment Amount (₹)</Form.Label>
                <Form.Control
                  type="number"
                  name="amount"
                  placeholder="Enter amount to pay"
                  className="payment-input"
                  value={paymentData.amount}
                  onChange={handleChange}
                  min="0"
                  max={bill ? bill.total_amount - bill.paid_amount : 0}
                  step="0.01"
                  required
                />
                {bill && (
                  <Form.Text className="text-muted">
                    Max: ₹{formatAmount(bill.total_amount - bill.paid_amount)}
                  </Form.Text>
                )}
              </Form.Group>

              {/* Payment Mode */}
              <Form.Group className="mb-3">
                <Form.Label>Payment Mode</Form.Label>
                <div className="payment-mode-grid">
                  {paymentModes.map(mode => (
                    <button
                      key={mode.value}
                      type="button"
                      className={`payment-mode-btn ${paymentData.payment_mode === mode.value ? 'active' : ''}`}
                      onClick={() => setPaymentData({ ...paymentData, payment_mode: mode.value })}
                    >
                      {mode.icon}
                      {mode.label}
                    </button>
                  ))}
                </div>
              </Form.Group>

              {/* QR Code Display */}
              {paymentData.payment_mode === 'QR' && qrSettings?.qr_code_image && (
                <div className="qr-display">
                  <div className="qr-image-wrapper">
                    <img 
                      src={qrSettings.qr_code_image} 
                      alt="UPI QR Code" 
                      className="qr-image"
                    />
                  </div>
                  <div className="qr-info">
                    <p><strong>UPI ID:</strong> {qrSettings.upi_id}</p>
                    <p className="text-muted">Scan QR code to pay via UPI</p>
                  </div>
                </div>
              )}

              {/* UPI ID Display */}
              {paymentData.payment_mode === 'UPI' && qrSettings?.upi_id && (
                <div className="upi-display">
                  <FiSmartphone size={20} className="upi-icon" />
                  <div>
                    <div className="upi-label">UPI ID</div>
                    <div className="upi-id">{qrSettings.upi_id}</div>
                  </div>
                </div>
              )}

              {/* Transaction ID */}
              {(paymentData.payment_mode === 'UPI' || paymentData.payment_mode === 'BANK') && (
                <Form.Group className="mb-3">
                  <Form.Label>Transaction ID (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="transaction_id"
                    placeholder="Enter transaction reference"
                    className="payment-input"
                    value={paymentData.transaction_id}
                    onChange={handleChange}
                  />
                </Form.Group>
              )}

              {/* Remarks */}
              <Form.Group className="mb-3">
                <Form.Label>Remarks (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="remarks"
                  placeholder="Any additional notes"
                  className="payment-textarea"
                  value={paymentData.remarks}
                  onChange={handleChange}
                />
              </Form.Group>

              <Button 
                type="submit" 
                className="payment-submit-btn"
                disabled={processing || !bill || parseFloat(paymentData.amount) <= 0}
              >
                {processing ? (
                  <>
                    <FiLoader className="spinning" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiDollarSign size={18} />
                    Pay ₹{formatAmount(paymentData.amount || 0)}
                  </>
                )}
              </Button>
            </Form>
          </div>
        </Col>

        {/* Right Side - Summary */}
        <Col lg={5}>
          <div className="payment-card summary-card">
            <h5 className="payment-card-title">
              <FiDollarSign size={18} />
              Payment Summary
            </h5>
            
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="summary-stat-label">Total Bills</span>
                <span className="summary-stat-value">₹{formatAmount(bills.reduce((sum, b) => sum + b.total_amount, 0))}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-stat-label">Total Paid</span>
                <span className="summary-stat-value" style={{ color: '#34D399' }}>
                  ₹{formatAmount(bills.reduce((sum, b) => sum + b.paid_amount, 0))}
                </span>
              </div>
              <div className="summary-stat">
                <span className="summary-stat-label">Total Pending</span>
                <span className="summary-stat-value" style={{ color: '#F87171' }}>
                  ₹{formatAmount(bills.reduce((sum, b) => sum + (b.total_amount - b.paid_amount), 0))}
                </span>
              </div>
            </div>

            <div className="summary-divider" />

            <div className="pending-bills-list">
              <h6 className="pending-bills-title">Pending Bills</h6>
              {pendingBills.length === 0 ? (
                <p className="text-muted text-center py-3">🎉 All bills paid!</p>
              ) : (
                pendingBills.map(b => (
                  <div key={b.id} className="pending-bill-item">
                    <div className="pending-bill-info">
                      <span className="pending-bill-month">{b.month}</span>
                      <span className="pending-bill-amount">
                        ₹{formatAmount(b.total_amount - b.paid_amount)}
                      </span>
                    </div>
                    <button
                      className="pending-bill-select-btn"
                      onClick={() => {
                        setBill(b);
                        setPaymentData(prev => ({
                          ...prev,
                          amount: b.total_amount - b.paid_amount
                        }));
                      }}
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Help */}
          <div className="payment-card help-card mt-3">
            <h5 className="payment-card-title">
              <FiAlertCircle size={18} />
              Need Help?
            </h5>
            <p className="help-text">
              For any payment related issues, please contact the admin.
            </p>
            <p className="help-text-small">
              📧 admin@rentflow.com
            </p>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default MyPayment;