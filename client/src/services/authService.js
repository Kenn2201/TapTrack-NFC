// Auth service — handles authentication, verification, and user management
import api from './api';

export const authService = {
  // Session & Credentials
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),

  // Email Verification
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),

  // Password Reset
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),

  // Profile
  updateProfile: (data) => api.patch('/users/me', data),
  changePassword: (data) => api.post('/users/me/password', data),

  // Admin User Management
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  updateStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
};

export default authService;
