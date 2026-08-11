import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Global CSS
import './styles/custom.css';

// Component CSS - Admin
import './components/common/Navbar.css';
import './components/common/Sidebar.css';
import './components/admin/AdminDashboard.css';
import './components/admin/Rooms.css';
import './components/admin/Bills.css';
import './components/admin/History.css';
import './components/admin/Settings.css';
import './components/admin/AllTenants.css';
import './components/auth/Login.css';
import './components/auth/Register.css';

// ❌ REMOVE these imports if files don't exist
// import './components/tenant/TenantBills.css';
// import './components/tenant/TenantPayment.css';
// import './components/tenant/TenantProfile.css';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/common/Sidebar';
import NavigationBar from './components/common/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import Rooms from './components/admin/Rooms';
import Bills from './components/admin/Bills';
import History from './components/admin/History';
import Settings from './components/admin/Settings';
import AllTenants from './components/admin/AllTenants';

// Tenant Components
import MyDashboard from './components/tenant/MyDashboard';
import MyBills from './components/tenant/MyBills';
import MyPayment from './components/tenant/MyPayment';
import MyProfile from './components/tenant/MyProfile';

// ========================================
// Protected Route Component - Role Based
// ========================================
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="text-center mt-5" style={{ color: 'var(--text-secondary)' }}>
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2">Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === 'admin') {
      return <Navigate to="/dashboard" />;
    } else if (role === 'tenant') {
      return <Navigate to="/tenant-dashboard" />;
    }
    return <Navigate to="/login" />;
  }
  
  return children;
};

// ========================================
// Admin Layout with Sidebar
// ========================================
const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <NavigationBar toggleSidebar={toggleSidebar} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// ========================================
// Tenant Layout with Sidebar
// ========================================
const TenantLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <NavigationBar toggleSidebar={toggleSidebar} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// ========================================
// App Routes
// ========================================
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/tenant-register" element={<Register />} />

      {/* Admin Routes */}
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/rooms" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout>
            <Rooms />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/bills" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout>
            <Bills />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/history" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout>
            <History />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/all-tenants" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout>
            <AllTenants />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout>
            <Settings />
          </AdminLayout>
        </ProtectedRoute>
      } />

      {/* Tenant Routes */}
      <Route path="/tenant-dashboard" element={
        <ProtectedRoute allowedRoles={['tenant']}>
          <TenantLayout>
            <MyDashboard />
          </TenantLayout>
        </ProtectedRoute>
      } />

      <Route path="/tenant-bills" element={
        <ProtectedRoute allowedRoles={['tenant']}>
          <TenantLayout>
            <MyBills />
          </TenantLayout>
        </ProtectedRoute>
      } />

      <Route path="/tenant-payment" element={
        <ProtectedRoute allowedRoles={['tenant']}>
          <TenantLayout>
            <MyPayment />
          </TenantLayout>
        </ProtectedRoute>
      } />

      <Route path="/tenant-profile" element={
        <ProtectedRoute allowedRoles={['tenant']}>
          <TenantLayout>
            <MyProfile />
          </TenantLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

// ========================================
// Main App Component
// ========================================
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;