// Admin email service — handles email operations
import api from './api';

export const adminEmailService = {
  sendDirect: (data) => api.post('/admin/emails/send', data),
  sendBroadcast: (data) => api.post('/admin/emails/broadcast', data),
  diagnostics: () => api.get('/admin/emails/diagnostics'),
};

export default adminEmailService;