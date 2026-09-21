// Attendance service — check-in and history
import api from './api';

export const attendanceService = {
  resolve: (token) => api.post('/nfc/resolve', { token }),
  checkIn: (data) => api.post('/nfc/check-in', data),
  verify: (token) => api.post('/nfc/verify', { token }),
  getHistory: () => api.get('/users/me/attendance'),
  getAll: () => api.get('/admin/attendance'),
  getOpenSessions: () => api.get('/sessions/open'),
  getSessionRecords: (id) => api.get(`/sessions/${id}/attendance`),
  closeSession: (id) => api.post(`/sessions/${id}/close`, {}),
  recordManual: (data) => api.post('/attendance/manual', data),
};

