// frontend/src/services/api.js

import axios from 'axios';

// ========================================
// 🔥 API URL - Auto-detect based on environment
// ========================================

// Get the current hostname (works for both localhost and network)
const hostname = window.location.hostname;

// If accessing from network (like mobile), use the network IP
// Otherwise use localhost
let API_URL;
if (hostname === 'localhost' || hostname === '127.0.0.1') {
  API_URL = 'http://localhost:8000/api/';
} else {
  // Use the same hostname but with port 8000 for backend
  API_URL = `http://${hostname}:8000/api/`;
}

// 🔥 For mobile testing, you can also hardcode your laptop IP
// const API_URL = 'http://192.168.1.100:8000/api/';

console.log('🔗 API URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', response.data.access);
          api.defaults.headers.Authorization = `Bearer ${response.data.access}`;
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_role');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH APIs
// ============================================
export const authAPI = {
  login: (username, password) => api.post('token/', { username, password }),
  refresh: (refresh) => api.post('token/refresh/', { refresh }),
  register: (data) => api.post('register/', data),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
  },
};

// ============================================
// OTP APIs
// ============================================
export const otpAPI = {
  checkEmail: (email) => api.post('check-email/', { email }),
  sendOTP: (email) => api.post('send-otp/', { email }),
  verifyOTP: (email, otp) => api.post('verify-otp/', { email, otp }),
  resendOTP: (email) => api.post('resend-otp/', { email }),
};

// ============================================
// TENANT APIs
// ============================================
export const tenantAPI = {
  checkMobile: (mobile) => api.post('tenant/check-mobile/', { mobile }),
  register: (data) => api.post('tenant/register/', data),
  login: (mobile, password) => api.post('tenant/login/', { mobile, password }),
  getProfile: () => api.get('tenant/profile/'),
  updateProfile: (data) => api.put('tenant/profile/', data),
  changePassword: (data) => api.post('tenant/change-password/', data),
  getBills: () => api.get('tenant/bills/'),
  payBill: (data) => api.post('tenant/pay-bill/', data),
};

// ============================================
// ROOM APIs
// ============================================
export const roomAPI = {
  getAll: () => api.get('rooms/'),
  getActive: () => api.get('rooms/active_rooms/'),
  getAllRooms: () => api.get('rooms/all_rooms/'),
  getById: (id) => api.get(`rooms/${id}/`),
  create: (data) => api.post('rooms/', data),
  update: (id, data) => api.put(`rooms/${id}/`, data),
  partialUpdate: (id, data) => api.patch(`rooms/${id}/`, data),
  delete: (id) => api.delete(`rooms/${id}/`),
  uploadAadhar: (id, data) => api.post(`rooms/${id}/upload_aadhar/`, data),
  getAadhar: (id) => api.get(`rooms/${id}/get_aadhar/`),
};

// ============================================
// BILL APIs
// ============================================
export const billAPI = {
  getAll: () => api.get('bills/'),
  getById: (id) => api.get(`bills/${id}/`),
  create: (data) => api.post('bills/', data),
  update: (id, data) => api.put(`bills/${id}/`, data),
  partialUpdate: (id, data) => api.patch(`bills/${id}/`, data),
  delete: (id) => api.delete(`bills/${id}/`),
  calculate: (id) => api.post(`bills/${id}/calculate_readings/`),
  close: (id) => api.post(`bills/${id}/close/`),
};

// ============================================
// READING APIs
// ============================================
export const readingAPI = {
  getAll: () => api.get('readings/'),
  getByMonth: (month) => api.get(`readings/by_month/?month=${month}`),
  getById: (id) => api.get(`readings/${id}/`),
  create: (data) => api.post('readings/', data),
  update: (id, data) => api.put(`readings/${id}/`, data),
  delete: (id) => api.delete(`readings/${id}/`),
  markPaid: (id, data) => api.post(`readings/${id}/mark_paid/`, data),
};

// ============================================
// PAYMENT APIs
// ============================================
export const paymentAPI = {
  getAll: () => api.get('payments/'),
  getById: (id) => api.get(`payments/${id}/`),
  create: (data) => api.post('payments/', data),
  update: (id, data) => api.put(`payments/${id}/`, data),
  delete: (id) => api.delete(`payments/${id}/`),
  getSummary: () => api.get('payments/summary/'),
  getByMonth: (month) => api.get(`payments/by_month/?month=${month}`),
};

// ============================================
// TENANT HISTORY APIs
// ============================================
export const tenantHistoryAPI = {
  getAll: () => api.get('tenant-history/'),
  getById: (id) => api.get(`tenant-history/${id}/`),
  create: (data) => api.post('tenant-history/', data),
  update: (id, data) => api.put(`tenant-history/${id}/`, data),
  delete: (id) => api.delete(`tenant-history/${id}/`),
  getAllTenants: () => api.get('tenant-history/all_tenants/'),
  getActiveTenants: () => api.get('tenant-history/active_tenants/'),
  getByRoom: (roomId) => api.get(`tenant-history/?room_id=${roomId}`),
  searchByName: (name) => api.get(`tenant-history/?tenant_name=${name}`),
};

// ============================================
// DASHBOARD APIs
// ============================================
export const dashboardAPI = {
  getStats: () => api.get('dashboard/stats/'),
};

// ============================================
// QR CODE APIs
// ============================================
export const qrAPI = {
  getSettings: () => api.get('qr-settings/'),
  getById: (id) => api.get(`qr-settings/${id}/`),
  create: (data) => api.post('qr-settings/', data),
  update: (id, data) => api.put(`qr-settings/${id}/`, data),
  delete: (id) => api.delete(`qr-settings/${id}/`),
  upload: (data) => api.post('qr-settings/upload_qr/', data),
};

export default {
  authAPI,
  otpAPI,
  tenantAPI,
  roomAPI,
  billAPI,
  readingAPI,
  paymentAPI,
  tenantHistoryAPI,
  dashboardAPI,
  qrAPI,
};

export const apiClient = api;