// Card service — NFC card CRUD and lifecycle
import api from './api';
import { buildUrlCheckInRequest } from '../utils/attendanceContext';

export const cardService = {
  getMyCard: () => api.get('/users/me/card'),
  getMyRequests: () => api.get('/users/me/card-requests'),
  createRequest: (data) => api.post('/users/me/card-requests', data),
  getAdminRequests: (status = '') => api.get('/admin/card-requests', { params: status ? { status } : {} }),
  updateRequestStatus: (id, data) => api.patch(`/admin/card-requests/${id}/status`, data),
  getAll: (params = '') => api.get(`/admin/cards${params ? `?${params}` : ''}`),
  getById: (id) => api.get(`/admin/cards/${id}`),
  provision: (data) => api.post('/admin/cards/provision', data),
  activate: (id, data) => api.patch(`/admin/cards/${id}/activate`, data),
  assign: (id, data) => api.patch(`/admin/cards/${id}/assign`, data),
  verifyCardToken: (token) => api.post('/nfc/verify', { token }),
  resolveCardToken: (token) => api.post('/nfc/resolve', { token }),
  recordAttendance: (token, context) => api.post('/nfc/check-in', { token, ...context }),
  recordUrlAttendance: (token, context) => api.post('/nfc/check-in/url', buildUrlCheckInRequest(token, context)),
  transition: (id, data) => api.patch(`/admin/cards/${id}/lifecycle`, data),
  replace: (id, data) => api.post(`/admin/cards/${id}/replace`, data),
};

export default cardService;
