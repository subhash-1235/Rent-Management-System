// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, tenantAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Create Context
const AuthContext = createContext();

// ========================================
// Custom Hook
// ========================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ========================================
// Auth Provider
// ========================================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    const userRole = localStorage.getItem('user_role') || null;
    
    if (token && userData) {
      setUser(userData);
      setRole(userRole);
    }
    setLoading(false);
  }, []);

  // ========================================
  // SINGLE LOGIN FUNCTION - Auto Detect
  // ========================================
  const login = async (username, password) => {
    try {
      setError(null);
      
      // Check if input is mobile (10 digits)
      const isMobile = /^[0-9]{10}$/.test(username.trim());
      
      if (isMobile) {
        // TENANT LOGIN
        try {
          const checkResponse = await tenantAPI.checkMobile(username.trim());
          
          if (!checkResponse.data.exists) {
            return { 
              success: false, 
              error: 'Mobile number not found. Please contact admin.',
              needsRegister: false
            };
          }
          
          if (!checkResponse.data.is_registered) {
            return { 
              success: false, 
              error: 'Account not registered. Please register first.',
              needsRegister: true,
              mobile: username.trim()
            };
          }
        } catch (checkError) {
          console.error('Check mobile error:', checkError);
          return { 
            success: false, 
            error: 'Unable to verify mobile number. Please try again.',
            needsRegister: false
          };
        }
        
        // Login tenant
        try {
          const response = await tenantAPI.login(username.trim(), password);
          const { access, refresh, tenant } = response.data;
          
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          localStorage.setItem('user_role', 'tenant');
          
          const userData = {
            id: tenant.id,
            name: tenant.name,
            mobile: tenant.mobile,
            email: tenant.email,
            room_number: tenant.room_number,
            room_rent: tenant.room_rent,
            role: 'tenant',
            is_registered: tenant.is_registered
          };
          localStorage.setItem('user', JSON.stringify(userData));
          
          setUser(userData);
          setRole('tenant');
          
          return { success: true, role: 'tenant' };
          
        } catch (loginError) {
          console.error('Tenant login error:', loginError);
          let errorMessage = 'Login failed. Please check your credentials.';
          if (loginError.response?.status === 401) {
            errorMessage = 'Invalid password';
          } else if (loginError.response?.status === 404) {
            errorMessage = 'Mobile number not found';
          }
          return { success: false, error: errorMessage, needsRegister: false };
        }
        
      } else {
        // ADMIN LOGIN
        try {
          const response = await authAPI.login(username.trim(), password);
          const { access, refresh } = response.data;
          
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          localStorage.setItem('user_role', 'admin');
          
          const userData = { 
            username: username.trim(), 
            role: 'admin',
            email: username.trim() + '@rentflow.com'
          };
          localStorage.setItem('user', JSON.stringify(userData));
          
          setUser(userData);
          setRole('admin');
          
          return { success: true, role: 'admin' };
          
        } catch (loginError) {
          console.error('Admin login error:', loginError);
          let errorMessage = 'Login failed. Please check your credentials.';
          if (loginError.response?.status === 401) {
            errorMessage = 'Invalid username or password';
          } else if (loginError.response?.status === 404) {
            errorMessage = 'Admin account not found';
          }
          return { success: false, error: errorMessage };
        }
      }
      
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check if backend is running.';
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ========================================
  // SINGLE REGISTER FUNCTION - Auto Detect
  // ========================================
  const register = async (data) => {
    try {
      setError(null);
      
      // Check if mobile is provided (tenant registration)
      if (data.mobile) {
        // TENANT REGISTRATION
        const response = await tenantAPI.register(data);
        const { access, refresh, tenant } = response.data;
        
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user_role', 'tenant');
        
        const userData = {
          id: tenant.id,
          name: tenant.name,
          mobile: tenant.mobile,
          email: tenant.email,
          room_number: tenant.room_number,
          room_rent: tenant.room_rent,
          role: 'tenant',
          is_registered: tenant.is_registered
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setRole('tenant');
        
        return { success: true, role: 'tenant', data: userData };
        
      } else {
        // ADMIN REGISTRATION - Use email prefix as username
        const username = data.email.split('@')[0];
        
        const response = await authAPI.register({
          username: username,
          email: data.email,
          password: data.password,
        });
        
        return { 
          success: true, 
          role: 'admin',
          data: response.data,
          message: 'Registration successful! Please login.'
        };
      }
      
    } catch (error) {
      console.error('Register error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data) {
        const errors = error.response.data;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ========================================
  // LOGOUT
  // ========================================
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    setUser(null);
    setRole(null);
    setError(null);
    navigate('/login');
  };

  const isAdmin = () => role === 'admin';
  const isTenant = () => role === 'tenant';

  const value = {
    user,
    role,
    loading,
    error,
    isAdmin,
    isTenant,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;