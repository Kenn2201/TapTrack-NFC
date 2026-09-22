// Admin feedback service — handles feedback triage operations
import api from './api';

export const adminFeedbackService = {
  list: (params) => api.get('/feedback', { params }),
  updateStatus: (id, status) => api.patch(`/admin/feedback/${id}/status`, { status }),
};

export default adminFeedbackService;