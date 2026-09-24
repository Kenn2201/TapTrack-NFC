// Event service — event CRUD
import api from './api';

export const eventService = {
  getAll: () => api.get('/events'),
  async getById(id) {
    const data = await api.get('/events/' + id);
    return data?.event || null;
  },
  create: (data) => api.post('/admin/events', data),
  update: (id, data) => api.patch('/admin/events/' + id, data),
  openSession: (id) => api.post(`/events/${id}/sessions`, {}),
};

export default eventService;
