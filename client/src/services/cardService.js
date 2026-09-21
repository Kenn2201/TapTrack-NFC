// Card service — NFC card CRUD and lifecycle
import api from './api';

export const cardService = {
  getMyCard: () => api.get('/users/me/card'),
  getAll: () => api.get('/admin/cards'),
  issue: (data) => api.post('/admin/cards', data),
  assign: (id, data) => api.post('/admin/cards/' + id + '/assign', data),
  revoke: (id, data) => api.post('/admin/cards/' + id + '/revoke', data),
  replace: (id, data) => api.post('/admin/cards/' + id + '/replace', data),
};

