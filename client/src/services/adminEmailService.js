// Admin email service — handles email operations
import api from './api';

export const adminEmailService = {
  sendDirect: (data) => api.post('/admin/emails/send', data),
  sendBroadcast: (data) => api.post('/admin/emails/broadcast', data),
  async diagnostics() {
    const data = await api.get('/admin/emails/diagnostics');
    return data?.diagnostics || { configured: false, provider: 'RESEND' };
  },
};

export default adminEmailService;
