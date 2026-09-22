// Admin event participants service — handles participant management
import api from './api';

export const adminEventParticipantsService = {
  list: (eventId) => api.get(`/admin/events/${eventId}/participants`),
  invite: (eventId, emails) => api.post(`/admin/events/${eventId}/participants/invite`, { emails }),
};

export default adminEventParticipantsService;