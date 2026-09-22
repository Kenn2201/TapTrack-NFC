// Event participants service — handles RSVP operations for invited users
import api from './api';

export const eventParticipantsService = {
  rsvp: (eventId, userId, status) => api.post(`/events/${eventId}/participants/rsvp`, { userId, status }),
};

export default eventParticipantsService;