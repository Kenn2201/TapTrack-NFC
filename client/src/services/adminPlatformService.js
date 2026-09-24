// Admin platform service — handles platform maintenance operations
import api from './api';

export const adminPlatformService = {
  async getStatus() {
    const data = await api.get('/platform/maintenance-status');
    return data?.maintenance || { maintenanceEnabled: false };
  },
  async setMaintenance({ enabled, message, estimatedReturn = null, releaseLabel = null }) {
    const data = await api.post('/admin/platform/maintenance', {
      enabled,
      message,
      estimatedReturn,
      releaseLabel,
    });
    return data;
  },
};

export default adminPlatformService;
