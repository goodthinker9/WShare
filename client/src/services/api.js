import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = '/api';
let refreshPromise = null;

const clearStoredAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - try to refresh token once for the original request.
    const isAuthEndpoint = /\/auth\/(login|refresh-token|logout)$/.test(originalRequest?.url || '');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          clearStoredAuth();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        if (!refreshPromise) {
          refreshPromise = axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          }).then(({ data }) => data.data.accessToken).finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;
        localStorage.setItem('accessToken', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect
        clearStoredAuth();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Show error toast for API errors (skip for 401/403 handled elsewhere)
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      const message = error.response?.data?.message || 'An error occurred';
      if (!originalRequest._silent) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Auth API
// ============================================================
export const authAPI = {
  register: (formData) => api.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

// ============================================================
// Resources API
// ============================================================
export const resourceAPI = {
  getDashboard: (params) => api.get('/resources/dashboard', { params }),
  getAll: (params) => api.get('/resources/all', { params }),
  search: (params) => api.get('/resources/search', { params }),
  getById: (id) => api.get(`/resources/${id}`),
  previewFile: (id) => api.get(`/resources/${id}/file`, { responseType: 'blob' }),
  upload: (formData) => api.post('/resources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
  review: (id, data) => api.put(`/resources/${id}/review`, data),
  getPending: (params) => api.get('/resources/pending', { params }),
};

// ============================================================
// Bookmarks API
// ============================================================
export const bookmarkAPI = {
  getAll: (params) => api.get('/bookmarks', { params }),
  toggle: (resourceId) => api.post(`/bookmarks/${resourceId}`),
};

// ============================================================
// Downloads API
// ============================================================
export const downloadAPI = {
  download: (resourceId) => api.post(`/downloads/${resourceId}`, {}, {
    responseType: 'blob',
  }),
  getHistory: (params) => api.get('/downloads/history', { params }),
};

// ============================================================
// Ratings API
// ============================================================
export const ratingAPI = {
  rate: (resourceId, data) => api.post(`/ratings/${resourceId}`, data),
  getResourceRatings: (resourceId) => api.get(`/ratings/${resourceId}`),
  delete: (id) => api.delete(`/ratings/${id}`),
};

// ============================================================
// Reports API
// ============================================================
export const reportAPI = {
  create: (data) => api.post('/reports', data),
  getAll: (params) => api.get('/reports', { params }),
  resolve: (id, data) => api.put(`/reports/${id}/resolve`, data),
};

// ============================================================
// Notifications API
// ============================================================
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// ============================================================
// Courses API
// ============================================================
export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// ============================================================
// Departments API
// ============================================================
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getLevels: () => api.get('/departments/levels'),
  getSemesters: () => api.get('/departments/semesters'),
  getFaculties: () => api.get('/departments/faculties'),
  getCourses: (params) => api.get('/departments/courses', { params }),
};

// ============================================================
// Invitation Codes API (Admin)
// ============================================================
export const invitationCodeAPI = {
  getAll: () => api.get('/invitation-codes'),
  create: (data) => api.post('/invitation-codes', data),
  disable: (id) => api.put(`/invitation-codes/${id}/disable`),
  delete: (id) => api.delete(`/invitation-codes/${id}`),
};

// ============================================================
// Users API (Admin)
// ============================================================
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getPendingVerifications: (params) => api.get('/users/pending-verifications', { params }),
  verify: (id, data) => api.put(`/users/${id}/verify`, data),
  updateStatus: (id, data) => api.put(`/users/${id}/status`, data),
  updateAssignment: (id, data) => api.put(`/users/${id}/assign`, data),
delete: (id) => api.delete(`/users/${id}`),
  getIDCard: (id) => api.get(`/users/${id}/id-card`, { responseType: 'blob', _silent: true }),
};

// ============================================================
// Analytics API (Admin)
// ============================================================
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getCharts: () => api.get('/analytics/charts'),
  getTopResources: () => api.get('/analytics/top-resources'),
  getActiveStudents: () => api.get('/analytics/active-students'),
  getVerificationStats: () => api.get('/analytics/verifications'),
  getDepartmentStats: () => api.get('/analytics/departments'),
  getRecentActivities: () => api.get('/analytics/activities'),
};

export default api;

