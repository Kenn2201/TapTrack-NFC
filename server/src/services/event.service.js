import { eventRepository } from '../repositories/event.repository.js';
import { auditService } from './audit.service.js';

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
    const event = await eventRepository.create({ ...data, status: data.status || 'DRAFT', createdBy: actor.id });
    await auditService.log({ actorId: actor.id, action: 'EVENT_CREATED', entityType: 'EVENT', entityId: event.id, metadata: { name: event.name, status: event.status } });
    return event;
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
    const event = await eventRepository.update(id, data);
    await auditService.log({ actorId: actor.id, action: 'EVENT_UPDATED', entityType: 'EVENT', entityId: id, metadata: { fields: Object.keys(data), status: event.status } });
    return event;
  },
};

export default eventService;
