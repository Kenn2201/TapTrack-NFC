// Attendance service — check-in and history
import api from './api';

export const attendanceService = {
  resolve: (token) => api.post('/nfc/resolve', { token }),
  checkIn: (data) => api.post('/nfc/check-in', data),
  verify: (token) => api.post('/nfc/verify', { token }),
  getHistory: () => api.get('/users/me/attendance'),
  getAll: () => api.get('/admin/attendance'),
};

