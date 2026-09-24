// Staff event participants service — list required participants; ADMIN can invite.
import api from './api';

export const adminEventParticipantsService = {
  async list(eventId) {
    const data = await api.get(`/admin/events/${eventId}/participants`);
    return Array.isArray(data?.participants) ? data.participants : [];
  },

  async invite(eventId, userIds) {
    const data = await api.post(`/admin/events/${eventId}/participants/invite`, { userIds });
    return Array.isArray(data?.participants) ? data.participants : [];
  },
};

export default adminEventParticipantsService;
