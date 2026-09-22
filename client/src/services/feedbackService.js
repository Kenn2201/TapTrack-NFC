// Feedback service — handles user feedback submission
import api from './api';

export const feedbackService = {
  submit: (data) => api.post('/feedback', data),
};

export default feedbackService;