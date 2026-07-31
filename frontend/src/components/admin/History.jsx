import React, { useState, useEffect } from 'react';
import { Spinner, Alert, Table, Row, Col, Form } from 'react-bootstrap';
import { FiClock, FiCalendar, FiDollarSign, FiDownload, FiUser, FiHome, FiSearch, FiFilter } from 'react-icons/fi';
import { paymentAPI } from '../../services/api';
import './History.css';

const History = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (payments.length > 0) {
      const months = new Set();
      payments.forEach(p => {
        const monthKey = p.bill_month_key;
        if (monthKey) {
          months.add(monthKey);
        }
      });
      
      const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
      setAvailableMonths(sortedMonths);
      
      if (sortedMonths.length > 0 && !selectedMonth) {
        setSelectedMonth(sortedMonths[0]);
      }
    }
  }, [payments]);

  useEffect(() => {
    applyFilters();
  }, [payments, searchTerm, selectedMonth]);

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

  const applyFilters = () => {
    let filtered = [...payments];

    if (selectedMonth) {
      filtered = filtered.filter(payment => {
        return payment.bill_month_key === selectedMonth;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(payment => {
        const tenantName = getTenantName(payment);
        const roomNumber = getRoomNumber(payment);
        const paymentMode = payment.payment_mode || '';
        const amount = String(payment.amount || '');
        
        return tenantName.toLowerCase().includes(term) || 
               String(roomNumber).includes(term) || 
               paymentMode.toLowerCase().includes(term) ||
               amount.includes(term);
      });
    }

    setFilteredPayments(filtered);
  };

  const getTenantName = (payment) => {
    if (payment.tenant_name) {
      return payment.tenant_name;
    }
    if (payment.room_reading?.tenant_name_snapshot) {
      return payment.room_reading.tenant_name_snapshot;
    }
    if (payment.room_reading?.room?.tenant_name) {
      return payment.room_reading.room.tenant_name;
    }
    if (payment.room_reading?.room_details?.tenant_name) {
      return payment.room_reading.room_details.tenant_name;
    }
    if (payment.room_reading_details?.tenant_name_snapshot) {
      return payment.room_reading_details.tenant_name_snapshot;
    }
    if (payment.room_reading_details?.room?.tenant_name) {
      return payment.room_reading_details.room.tenant_name;
    }
    return 'N/A';
  };

  const getRoomNumber = (payment) => {
    if (payment.room_number) {
      return payment.room_number;
    }
    if (payment.room_reading?.room?.room_number) {
      return payment.room_reading.room.room_number;
    }
    if (payment.room_reading?.room_details?.room_number) {
      return payment.room_reading.room_details.room_number;
    }
    if (payment.room_reading_details?.room?.room_number) {
      return payment.room_reading_details.room.room_number;
    }
    return '—';
  };

  const formatMonthDisplay = (monthKey) => {
    if (!monthKey) return '';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleExport = () => {
    if (filteredPayments.length === 0) {
      alert('No data to export!');
      return;
    }

    const headers = ['#', 'Room', 'Tenant', 'Amount', 'Payment Mode', 'Payment Date', 'Status'];
    const rows = filteredPayments.map((payment, index) => {
      return [
        index + 1,
        `Room ${getRoomNumber(payment)}`,
        getTenantName(payment),
        payment.amount || 0,
        payment.payment_mode || '—',
        payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '—',
        'Completed'
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_history_${selectedMonth || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-4">{error}</Alert>;
  }

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const uniqueTenants = new Set();
  filteredPayments.forEach(p => {
    const name = getTenantName(p);
    if (name && name !== 'N/A' && name !== '') uniqueTenants.add(name);
  });

  const stats = [
    { 
      icon: <FiDollarSign size={22} />, 
      number: `₹${totalAmount.toFixed(2)}`, 
      label: 'Total Received', 
      change: `${filteredPayments.length} txns`,
      cardClass: 'card-gold' 
    },
    { 
      icon: <FiClock size={22} />, 
      number: filteredPayments.length, 
      label: 'Total Transactions', 
      change: `₹${totalAmount.toFixed(2)}`,
      cardClass: 'card-blue' 
    },
    { 
      icon: <FiUser size={22} />, 
      number: uniqueTenants.size, 
      label: 'Unique Tenants', 
      change: '',
      cardClass: 'card-green' 
    },
    { 
      icon: <FiCalendar size={22} />, 
      number: selectedMonth ? formatMonthDisplay(selectedMonth) : 'All Time', 
      label: 'Showing Month', 
      change: '',
      cardClass: 'card-purple' 
    },
  ];

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h1>📜 Payment History</h1>
        <button className="btn-primary-gradient" onClick={handleExport}>
          <FiDownload size={16} />
          Export CSV
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

      {/* Month Filter + Search */}
      <div className="search-filter-bar">
        <div className="month-filter">
          <FiCalendar className="filter-icon" />
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-select"
          >
            <option value="">All Months</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {formatMonthDisplay(month)}
              </option>
            ))}
          </select>
        </div>

        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by tenant name, room, payment mode or amount..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="table-wrap">
        {filteredPayments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <div className="empty-title">No payment history found</div>
            <div className="empty-sub">
              {searchTerm ? 'Try changing your search.' : 'No payments for this month.'}
            </div>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="table-premium history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Room</th>
                  <th>Tenant</th>
                  <th>Amount (₹)</th>
                  <th>Payment Mode</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => {
                  const tenantName = getTenantName(payment);
                  const roomNumber = getRoomNumber(payment);
                  const amount = parseFloat(payment.amount) || 0;
                  const paymentMode = payment.payment_mode || '—';
                  const paymentDate = payment.payment_date ? new Date(payment.payment_date) : null;
                  const dateStr = paymentDate ? paymentDate.toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  }) : '—';

                  return (
                    <tr key={payment.id || index}>
                      <td>{index + 1}</td>
                      <td><strong>Room {roomNumber}</strong></td>
                      <td>{tenantName}</td>
                      <td>
                        <strong style={{ color: '#34D399' }}>
                          ₹{amount.toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span className="badge-status paid">
                          {paymentMode}
                        </span>
                      </td>
                      <td>{dateStr}</td>
                      <td>
                        <span className="badge-status paid">✅ Completed</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredPayments.length > 0 && (
        <div className="history-summary">
          <span>
            Showing <strong>{filteredPayments.length}</strong> payments
          </span>
          <span>
            Total Amount: <strong style={{ color: '#34D399' }}>₹{totalAmount.toFixed(2)}</strong>
          </span>
          <span>
            Unique Tenants: <strong>{uniqueTenants.size}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default History;