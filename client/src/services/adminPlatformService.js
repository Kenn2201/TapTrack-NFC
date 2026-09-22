// Admin platform service — handles platform maintenance operations
import api from './api';

export const adminPlatformService = {
  getStatus: () => api.get('/platform/maintenance-status'),
  setMaintenance: (data) => api.post('/admin/platform/maintenance', data),
};

export default adminPlatformService;