import { eventRepository } from '../repositories/event.repository.js';
import { auditService } from './audit.service.js';

const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

/**
 * Deterministic scheduled EVENT status reconciliation.
 *
 * IMPORTANT: EVENT status and ATTENDANCE SESSION status are separate concepts.
 * This function only ever reconciles the EVENT record. It NEVER creates,
 * opens, or closes an attendance session.
 *
 * Rules:
 * - Terminal states (CANCELLED, and manually CLOSED records) are never auto-reopened.
 * - Before scheduled start: the existing pre-open state (usually DRAFT) is preserved.
 * - start <= now < end : event becomes OPEN
 * - now >= end         : event becomes CLOSED
 *
 * Timestamps are compared in UTC epoch milliseconds; no local timezone string is
 * ever persisted by this logic.
 */
export function deriveScheduledStatus(event, now = Date.now()) {
  if (!event || !event.startAt || !event.endAt) return event?.status || null;
  if (event.status === 'CANCELLED' || event.status === 'CLOSED') return event.status;
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return event.status;
  if (now >= end) return 'CLOSED';
  if (now >= start) return 'OPEN';
  return event.status; // before start: DRAFT / existing pre-open state preserved
}

/**
 * Lazily persists a reconciled status only when it actually changes,
 * keeping repeated reconciliation idempotent.
 */
export async function reconcileEventStatus(event, now = Date.now()) {
  if (!event) return null;
  const next = deriveScheduledStatus(event, now);
  if (next === event.status) return event;
  return eventRepository.update(event.id, { status: next });
}

export const eventService = {
  async listEvents(now = Date.now()) {
    const events = await eventRepository.findAll();
    const reconciled = [];
    for (const event of events) {
      reconciled.push(await reconcileEventStatus(event, now));
    }
    return reconciled;
  },
  async getEvent(id, now = Date.now()) {
    const event = await eventRepository.findById(id);
    if (!event) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');
    return reconcileEventStatus(event, now);
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
    return reconcileEventStatus(event);
  },
};

export default eventService;