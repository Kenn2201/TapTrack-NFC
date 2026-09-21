// Event service — event CRUD
import api from './api';

export const eventService = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get('/events/' + id),
  create: (data) => api.post('/admin/events', data),
  update: (id, data) => api.patch('/admin/events/' + id, data),
  openSession: (id) => api.post(`/events/${id}/sessions`, {}),
};

