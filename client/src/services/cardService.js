// Card service — NFC card CRUD and lifecycle
import api from './api';

export const cardService = {
  getMyCard: () => api.get('/users/me/card'),
  getAll: (params = '') => api.get(`/admin/cards${params ? `?${params}` : ''}`),
  getById: (id) => api.get(`/admin/cards/${id}`),
  provision: (data) => api.post('/admin/cards/provision', data),
  activate: (id, data) => api.patch(`/admin/cards/${id}/activate`, data),
  assign: (id, data) => api.patch(`/admin/cards/${id}/assign`, data),
  verifyCardToken: (token) => api.post('/nfc/verify', { token }),
  resolveCardToken: (token) => api.post('/nfc/resolve', { token }),
};

export default cardService;
