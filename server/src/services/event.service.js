import { eventRepository } from '../repositories/event.repository.js';

const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

export const eventService = {
  listEvents() { return eventRepository.findAll(); },
  async getEvent(id) {
    const event = await eventRepository.findById(id);
    if (!event) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');
    return event;
  },
  async createEvent(data, actor) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can create events.');
    if (new Date(data.endAt) <= new Date(data.startAt)) throw fail(400, 'INVALID_EVENT_WINDOW', 'Event end must be after its start.');
    return eventRepository.create({ ...data, status: data.status || 'DRAFT', createdBy: actor.id });
  },
  async updateEvent(id, data, actor) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can edit events.');
    const current = await this.getEvent(id);
    if (['CLOSED', 'CANCELLED'].includes(current.status) && data.status === 'OPEN') {
      throw fail(409, 'INVALID_EVENT_TRANSITION', 'Closed or cancelled events cannot be reopened.');
    }
    const start = data.startAt || current.startAt;
    const end = data.endAt || current.endAt;
    if (new Date(end) <= new Date(start)) throw fail(400, 'INVALID_EVENT_WINDOW', 'Event end must be after its start.');
    return eventRepository.update(id, data);
  },
};

export default eventService;
