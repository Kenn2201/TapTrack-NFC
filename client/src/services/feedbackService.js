// Feedback service — handles authenticated and public feedback submission
import api from './api';

export const feedbackService = {
  submit: (data) => api.post('/feedback', data),
  submitPublic: (data) => api.post('/feedback/public', data),
};

export default feedbackService;
