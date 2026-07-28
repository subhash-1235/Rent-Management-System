import React, { useState, useEffect } from 'react';
import { Spinner, Alert, Table, Row, Col } from 'react-bootstrap';
import { FiClock, FiCalendar, FiDollarSign, FiDownload } from 'react-icons/fi';
import { paymentAPI } from '../../services/api';
import './History.css';

const History = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getAll();
      setPayments(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => alert('Export feature coming soon!');

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-4">{error}</Alert>;
  }

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const stats = [
    { icon: <FiDollarSign size={22} />, number: `₹${totalAmount.toLocaleString()}`, label: 'Total Received', change: '+12%', cardClass: 'card-gold' },
    { icon: <FiClock size={22} />, number: payments.length, label: 'Total Transactions', change: '+8%', cardClass: 'card-blue' },
    { icon: <FiCalendar size={22} />, number: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), label: 'Current Month', change: '', cardClass: 'card-green' },
    { icon: '✅', number: payments.filter(p => p.payment_mode).length, label: 'Completed', change: '+5%', cardClass: 'card-purple' },
  ];

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div>
          <h1>📜 History</h1>
          <p>View all payment history</p>
        </div>
        <button className="btn-ghost" onClick={handleExport}>
          <FiDownload size={16} />
          Export Report
        </button>
      </div>

      <Row className="g-3 mb-4">
        {stats.map((stat, index) => (
          <Col md={3} sm={6} xs={6} key={index}>
            <div className={`stat-card ${stat.cardClass}`}>
              <div className="stat-left">
                <div className="stat-icon">{stat.icon}</div>
                {stat.change && <span className="stat-change">{stat.change}</span>}
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
        {payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <div className="empty-title">No payment history</div>
            <div className="empty-sub">Payments will appear here.</div>
          </div>
        ) : (
          <table className="table-premium">
            <thead>
              <tr>
                <th>#</th>
                <th>Tenant</th>
                <th>Room</th>
                <th>Amount (₹)</th>
                <th>Payment Mode</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={payment.id || index}>
                  <td>{index + 1}</td>
                  <td>{payment.room_reading?.room?.tenant_name || 'N/A'}</td>
                  <td>Room {payment.room_reading?.room?.room_number || '—'}</td>
                  <td><strong style={{ color: '#34D399' }}>₹{payment.amount || 0}</strong></td>
                  <td>
                    <span className="badge-status paid">
                      {payment.payment_mode || '—'}
                    </span>
                  </td>
                  <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '—'}</td>
                  <td>
                    <span className="badge-status paid">✅ Completed</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default History;