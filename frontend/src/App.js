import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Global CSS
import './styles/custom.css';

// Component CSS
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

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/common/Sidebar';
import NavigationBar from './components/common/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminDashboard from './components/admin/AdminDashboard';
import Rooms from './components/admin/Rooms';
import Bills from './components/admin/Bills';
import History from './components/admin/History';
import Settings from './components/admin/Settings';
import AllTenants from './components/admin/AllTenants';

// ========================================
// Protected Route Component
// ========================================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="text-center mt-5" style={{ color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// ========================================
// Main App Layout with Sidebar
// ========================================
const AppLayout = ({ children }) => {
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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <AdminDashboard />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <AdminDashboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/rooms" element={
        <ProtectedRoute>
          <AppLayout>
            <Rooms />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/bills" element={
        <ProtectedRoute>
          <AppLayout>
            <Bills />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/history" element={
        <ProtectedRoute>
          <AppLayout>
            <History />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/all-tenants" element={
        <ProtectedRoute>
          <AppLayout>
            <AllTenants />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      } />
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