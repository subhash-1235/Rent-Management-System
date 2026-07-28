import axios from 'axios';

// API Base URL
const API_URL = 'http://127.0.0.1:8000/api/';

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
  (error) => {
    return Promise.reject(error);
  }
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
  login: (username, password) => 
    api.post('token/', { username, password }),
  refresh: (refresh) => 
    api.post('token/refresh/', { refresh }),
};

// ============================================
// ROOM APIs
// ============================================
export const roomAPI = {
  getAll: () => api.get('rooms/'),
  getActive: () => api.get('rooms/active_rooms/'),
  getById: (id) => api.get(`rooms/${id}/`),
  create: (data) => api.post('rooms/', data),
  update: (id, data) => api.put(`rooms/${id}/`, data),
  delete: (id) => api.delete(`rooms/${id}/`),
};

// ============================================
// BILL APIs
// ============================================
export const billAPI = {
  getAll: () => api.get('bills/'),
  getById: (id) => api.get(`bills/${id}/`),
  create: (data) => api.post('bills/', data),
  update: (id, data) => api.put(`bills/${id}/`, data),
  delete: (id) => api.delete(`bills/${id}/`),
  calculate: (id) => api.post(`bills/${id}/calculate_readings/`),
};

// ============================================
// READING APIs
// ============================================
export const readingAPI = {
  getAll: () => api.get('readings/'),
  getByMonth: (month) => api.get(`readings/by_month/?month=${month}`),
  create: (data) => api.post('readings/', data),
  markPaid: (id, data) => api.post(`readings/${id}/mark_paid/`, data),
};

// ============================================
// PAYMENT APIs
// ============================================
export const paymentAPI = {
  getAll: () => api.get('payments/'),
  getById: (id) => api.get(`payments/${id}/`),
  create: (data) => api.post('payments/', data),
  getSummary: () => api.get('payments/summary/'),
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
  update: (id, data) => api.put(`qr-settings/${id}/`, data),
  upload: (data) => api.post('qr-settings/upload_qr/', data),
};

export default api;