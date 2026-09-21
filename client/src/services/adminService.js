import api from './api';
export const adminService = { getDashboard: () => api.get('/admin/dashboard') };
