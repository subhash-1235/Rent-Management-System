import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiUsers,
  FiFileText,
  FiUser,
  FiCalendar,
  FiFilter,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { dashboardAPI, roomAPI, billAPI, paymentAPI, readingAPI } from '../../services/api';
import './AdminDashboard.css';

// ========================================
// STATS CARDS COMPONENT
// ========================================
const StatsCards = ({ stats }) => {
  const statItems = [
    {
      icon: <FiHome size={22} />,
      number: stats.totalRooms || 0,
      label: 'Total Rooms',
      change: '',
      cardClass: 'card-gold'
    },
    {
      icon: <FiDollarSign size={22} />,
      number: `₹${(stats.overallTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      label: 'Total Collection',
      change: '',
      cardClass: 'card-purple'
    },
    {
      icon: <FiCheckCircle size={22} />,
      number: `₹${(stats.currentMonthPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      label: 'This Month Received',
      change: '',
      cardClass: 'card-green'
    },
    {
      icon: <FiClock size={22} />,
      number: `₹${(stats.overallPending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      label: 'Total Pending',
      change: '',
      cardClass: 'card-rose'
    },
  ];

  return (
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
  );
};

// ========================================
// ROOM TABLE COMPONENT
// ========================================
const RoomTable = ({ rooms = [], month, onMonthChange, availableMonths = [], searchTerm = '', onSearchChange = () => { } }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredRooms = rooms.filter(room => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    const roomNumber = String(room.room_number || '');
    const tenantName = (room.tenant_name || '').toLowerCase();
    const mobile = (room.tenant_mobile || '');
    return roomNumber.includes(term) || tenantName.includes(term) || mobile.includes(term);
  });

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRooms = filteredRooms.slice(startIndex, endIndex);

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

  const getMobileNumber = (roomData) => {
    if (roomData.tenant_mobile && roomData.tenant_mobile !== '—' && roomData.tenant_mobile !== '') {
      return roomData.tenant_mobile;
    }
    if (roomData.room?.tenant_mobile) {
      return roomData.room.tenant_mobile;
    }
    if (roomData.tenant_mobile_snapshot) {
      return roomData.tenant_mobile_snapshot;
    }
    return '—';
  };

  return (
    <div className="table-wrap">
      <div className="table-header">
        <h6>📊 Room-wise Bill Details</h6>
        <div className="table-header-right">
          <div className="month-filter">
            <FiCalendar size={14} className="filter-icon" />
            <select
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              className="month-select"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <span className="room-count">{filteredRooms.length} rooms</span>
        </div>
      </div>
      <div className="room-table-scroll">
        <table className="table-premium">
          <thead>
            <tr>
              <th>#</th>
              <th>Room No</th>
              <th>Tenant</th>
              <th>Mobile</th>
              <th>Units</th>
              <th>Rent</th>
              <th>Bill</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentRooms.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center" style={{ padding: '30px', color: 'var(--text-muted)' }}>
                  🔍 No rooms found matching your search
                </td>
              </tr>
            ) : (
              currentRooms.map((room, index) => {
                const roomData = room.room_details || room.room || room;
                const total = parseFloat(room.total_amount || 0);
                const paid = parseFloat(room.paid_amount || 0);
                const remaining = total - paid;
                const status = getStatusBadge(room.is_paid, total, paid);
                const mobile = getMobileNumber(room);

                return (
                  <tr key={room.id || index}>
                    <td>{startIndex + index + 1}</td>
                    <td><strong>Room {room.room_number || '?'}</strong></td>
                    <td>{room.tenant_name || '—'}</td>
                    <td>{mobile}</td>
                    <td>{parseFloat(room.units_consumed || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(room.room_rent || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(room.electricity_charge || 0).toFixed(2)}</td>
                    <td><strong>₹{total.toFixed(2)}</strong></td>
                    <td style={{ color: '#34D399' }}>₹{paid.toFixed(2)}</td>
                    <td style={{ color: remaining > 0 ? '#F87171' : '#34D399' }}>
                      ₹{remaining.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge-status ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
// PENDING DUES TABLE
// ========================================
const PendingDuesTable = ({ pendingDues = [], searchTerm = '', onSearchChange = () => { } }) => {
  const [expandedTenants, setExpandedTenants] = useState({});
  const [filterMonth, setFilterMonth] = useState('all');

  const filteredDues = pendingDues.filter(due => {
    const monthMatch = filterMonth === 'all' || due.month === filterMonth;
    const searchMatch = !searchTerm ||
      due.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      due.room_number?.toString().includes(searchTerm);
    return monthMatch && searchMatch;
  });

  if (!pendingDues || pendingDues.length === 0) {
    return (
      <div className="pending-dues-wrap">
        <div className="pending-dues-header">
          <h6><FiCheckCircle size={16} style={{ color: '#34D399' }} /> No Pending Dues</h6>
          <span className="pending-count" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34D399' }}>
            ✅ All Clear
          </span>
        </div>
        <div className="pending-dues-empty">
          <FiCheckCircle size={24} style={{ color: '#34D399' }} />
          <span>All tenants are up to date with payments!</span>
        </div>
      </div>
    );
  }

  const uniqueMonths = ['all', ...new Set(pendingDues.map(d => d.month))];

  if (filteredDues.length === 0) {
    return (
      <div className="pending-dues-wrap">
        <div className="pending-dues-header">
          <h6><FiAlertTriangle size={16} style={{ color: '#FBBF24' }} /> Pending Dues</h6>
          <div className="pending-header-right">
            <span className="pending-count">No matches found</span>
          </div>
        </div>
        <div className="pending-filters">
          <div className="pending-search">
            <input
              type="text"
              placeholder="Search tenant or room..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="pending-month-filter">
            <FiCalendar size={14} />
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
              <option value="all">All Months</option>
              {uniqueMonths.filter(m => m !== 'all').map((month, idx) => (
                <option key={idx} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="pending-dues-empty">
          <span>🔍 No pending dues match your search.</span>
        </div>
      </div>
    );
  }

  const groupedDues = filteredDues.reduce((acc, due) => {
    const key = `${due.tenant_name}_${due.room_number}`;
    if (!acc[key]) {
      acc[key] = {
        tenant_name: due.tenant_name,
        room_number: due.room_number,
        dues: []
      };
    }
    acc[key].dues.push(due);
    return acc;
  }, {});

  const toggleExpand = (key) => {
    setExpandedTenants(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const totalPending = filteredDues.reduce((sum, d) => sum + (d.pending_amount || 0), 0);
  const totalPaid = filteredDues.reduce((sum, d) => sum + (d.paid_amount || 0), 0);
  const totalBill = filteredDues.reduce((sum, d) => sum + (d.total_amount || 0), 0);

  return (
    <div className="pending-dues-wrap">
      <div className="pending-dues-header">
        <h6><FiAlertTriangle size={16} style={{ color: '#FBBF24' }} /> Pending Dues</h6>
        <div className="pending-header-right">
          <span className="pending-count">{filteredDues.length} entries</span>
          <span className="pending-total">Total Pending: ₹{totalPending.toFixed(2)}</span>
        </div>
      </div>

      <div className="pending-filters">
        <div className="pending-search">
          <input
            type="text"
            placeholder="Search tenant or room..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="pending-month-filter">
          <FiCalendar size={14} />
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="all">All Months</option>
            {uniqueMonths.filter(m => m !== 'all').map((month, idx) => (
              <option key={idx} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pending-table-scroll">
        <table className="pending-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Room No</th>
              <th>Tenant</th>
              <th>Month</th>
              <th>Total Rent</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedDues).map((key, groupIndex) => {
              const group = groupedDues[key];
              const isExpanded = expandedTenants[key] || false;
              const totalDue = group.dues.reduce((sum, d) => sum + (d.pending_amount || 0), 0);
              const totalBillAmt = group.dues.reduce((sum, d) => sum + (d.total_amount || 0), 0);
              const totalPaidAmt = group.dues.reduce((sum, d) => sum + (d.paid_amount || 0), 0);

              return (
                <React.Fragment key={key}>
                  <tr className="group-header" onClick={() => toggleExpand(key)}>
                    <td>{groupIndex + 1}</td>
                    <td><strong>Room {group.room_number}</strong></td>
                    <td><strong>{group.tenant_name}</strong></td>
                    <td colSpan="2" style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                      {group.dues.length} month{group.dues.length > 1 ? 's' : ''} pending
                      <span style={{ marginLeft: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </span>
                    </td>
                    <td style={{ color: '#34D399' }}>₹{totalPaidAmt.toFixed(2)}</td>
                    <td style={{ color: '#F87171', fontWeight: 700 }}>₹{totalDue.toFixed(2)}</td>
                    <td><span className="badge-status pending">⏳ Pending</span></td>
                  </tr>

                  {isExpanded && group.dues.map((due, idx) => (
                    <tr key={`${key}_${idx}`} className="expanded-row">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>{due.month}</td>
                      <td>₹{(due.total_amount || 0).toFixed(2)}</td>
                      <td style={{ color: '#34D399' }}>₹{(due.paid_amount || 0).toFixed(2)}</td>
                      <td style={{ color: '#F87171', fontWeight: 600 }}>
                        ₹{(due.pending_amount || 0).toFixed(2)}
                      </td>
                      <td><span className="badge-status pending">⏳ Pending</span></td>
                    </tr>
                  ))}

                  {isExpanded && (
                    <tr className="summary-row">
                      <td colSpan="3"></td>
                      <td colSpan="2" style={{ textAlign: 'right', fontWeight: 600 }}>
                        Total for {group.tenant_name}:
                      </td>
                      <td style={{ color: '#34D399', textAlign: 'center' }}>₹{totalPaidAmt.toFixed(2)}</td>
                      <td style={{ color: '#F87171', fontWeight: 700 }}>₹{totalDue.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700 }}>
                Grand Total:
              </td>
              <td style={{ fontWeight: 600, textAlign: 'center' }}>₹{totalBill.toFixed(2)}</td>
              <td style={{ color: '#34D399', textAlign: 'center', fontWeight: 600 }}>₹{totalPaid.toFixed(2)}</td>
              <td style={{ color: '#F87171', textAlign: 'center', fontWeight: 700, fontSize: '16px' }}>
                ₹{totalPending.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// ========================================
// ADMIN DASHBOARD MAIN - FIXED
// ========================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    overallTotal: 0,
    currentMonthPaid: 0,
    overallPending: 0,
    month: '',
  });
  const [rooms, setRooms] = useState([]);
  const [pendingDues, setPendingDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthData(selectedMonth);
    }
  }, [selectedMonth]);

  // 🔥 MAIN FUNCTION: Load all data including pending calculation
  const loadAllData = async () => {
    try {
      setLoading(true);

      // 1. Get all bills
      const billsRes = await billAPI.getAll();
      const bills = billsRes.data || [];

      // 2. Get all rooms
      const roomsRes = await roomAPI.getAll();
      const allRooms = roomsRes.data || [];
      const totalRoomsCount = allRooms.length;


      // 3. Get all readings for all bills and calculate pending
      let overallTotalBill = 0;
      let overallTotalPaid = 0;
      let allPendingDues = [];
      let monthMap = {};

      for (const bill of bills) {
        const readingsRes = await readingAPI.getByMonth(bill.month);
        const readings = readingsRes.data || [];
        const monthLabel = new Date(bill.month).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit'
        });

        for (const reading of readings) {
          const total = parseFloat(reading.total_amount) || 0;
          const paid = parseFloat(reading.paid_amount) || 0;
          const pending = total - paid;

          overallTotalBill += total;
          overallTotalPaid += paid;

          // Get tenant name
          const tenantName = reading.tenant_name_snapshot || reading.room_details?.tenant_name || '—';
          const roomNumber = reading.room_details?.room_number || reading.room || '?';

          // 🔥 Track pending dues
          if (pending > 0 && tenantName !== '—') {
            allPendingDues.push({
              tenant_name: tenantName,
              room_number: roomNumber,
              month: monthLabel,
              total_amount: total,
              paid_amount: paid,
              pending_amount: pending,
              reading_id: reading.id
            });
          }
        }

        // Track months for dropdown
        monthMap[bill.month] = {
          value: bill.month,
          label: new Date(bill.month).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          })
        };
      }

      // 4. Set available months
      const sortedMonths = Object.values(monthMap).sort((a, b) =>
        new Date(b.value) - new Date(a.value)
      );
      setAvailableMonths(sortedMonths);

      if (sortedMonths.length > 0 && !selectedMonth) {
        setSelectedMonth(sortedMonths[0].value);
      }

      // 5. Calculate current month paid
      const currentMonth = sortedMonths.length > 0 ? sortedMonths[0].value : '';
      let currentMonthPaid = 0;
      if (currentMonth) {
        const currentReadings = await readingAPI.getByMonth(currentMonth);
        currentMonthPaid = (currentReadings.data || []).reduce((sum, r) =>
          sum + (parseFloat(r.paid_amount) || 0), 0
        );
      }

      // 6. Set stats
      setStats({
        totalRooms: totalRoomsCount,
        overallTotal: overallTotalPaid,
        currentMonthPaid: currentMonthPaid,
        overallPending: overallTotalBill - overallTotalPaid,
        month: currentMonth,
      });

      // 7. Set pending dues
      setPendingDues(allPendingDues);

      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthData = async (month) => {
    try {
      const readingsRes = await readingAPI.getByMonth(month);
      const readings = readingsRes.data || [];

      const formattedRooms = readings.map(reading => ({
        id: reading.id,
        room_number: reading.room_details?.room_number || reading.room || '?',
        tenant_name: reading.tenant_name_snapshot || reading.room_details?.tenant_name || '—',
        tenant_mobile: reading.tenant_mobile_snapshot || reading.room_details?.tenant_mobile || '—',
        units_consumed: reading.units_consumed || 0,
        room_rent: reading.room_details?.room_rent || 0,
        electricity_charge: reading.electricity_charge || 0,
        total_amount: reading.total_amount || 0,
        paid_amount: reading.paid_amount || 0,
        is_paid: reading.is_paid || false,
      }));

      setRooms(formattedRooms);
    } catch (err) {
      console.error('Error fetching month data:', err);
      setRooms([]);
    }
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
  };

  const handleAddBill = () => navigate('/bills');
  const handleManageRooms = () => navigate('/rooms');
  const handleHistory = () => navigate('/history');
  const handleAllTenants = () => navigate('/all-tenants');

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
          onClick={loadAllData}
          style={{ padding: '4px 16px', fontSize: '12px' }}
        >
          Retry
        </button>
      </Alert>
    );
  }

  return (
    <div className="fade-in-up">
      <StatsCards stats={stats} />

      <div className="dashboard-buttons">
        <button className="btn-primary-gradient" onClick={handleAddBill}>
          <FiPlus size={14} />
          Add New Bill
        </button>
        <button className="btn-primary-gradient pink" onClick={handleManageRooms}>
          <FiUsers size={14} />
          Manage Rooms
        </button>
        <button className="btn-primary-gradient purple" onClick={handleAllTenants}>
          <FiUser size={14} />
          All Tenants
        </button>
        <button className="btn-ghost" onClick={handleHistory}>
          <FiFileText size={14} />
          History
        </button>
      </div>

      <RoomTable
        rooms={rooms}
        month={selectedMonth}
        onMonthChange={handleMonthChange}
        availableMonths={availableMonths}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <PendingDuesTable
        pendingDues={pendingDues}
        searchTerm={pendingSearchTerm}
        onSearchChange={setPendingSearchTerm}
      />
    </div>
  );
};

export default AdminDashboard;