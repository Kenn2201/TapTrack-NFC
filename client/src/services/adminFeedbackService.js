// Admin feedback service — handles feedback triage operations
import api from './api';

export const adminFeedbackService = {
  async list(params) {
    const data = await api.get('/feedback', { params });
    return Array.isArray(data?.feedback) ? data.feedback : [];
  },
  updateStatus: (id, status) => api.patch(`/admin/feedback/${id}/status`, { status }),
};

export default adminFeedbackService;
