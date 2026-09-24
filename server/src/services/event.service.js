import { eventRepository } from '../repositories/event.repository.js';
import { eventParticipantsRepository } from '../repositories/eventParticipants.repository.js';
import { auditService } from './audit.service.js';

const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const isStaff = (actor) => ['ADMIN', 'OPERATOR'].includes(actor?.role);

/**
 * Deterministic scheduled EVENT status reconciliation.
 *
 * IMPORTANT: EVENT status and ATTENDANCE SESSION status are separate concepts.
 * This function only ever reconciles the EVENT record. It NEVER creates,
 * opens, or closes an attendance session.
 */
export function deriveScheduledStatus(event, now = Date.now()) {
  if (!event || !event.startAt || !event.endAt) return event?.status || null;
  if (event.status === 'CANCELLED' || event.status === 'CLOSED') return event.status;
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return event.status;
  if (now >= end) return 'CLOSED';
  if (now >= start) return 'OPEN';
  return event.status;
}

export async function reconcileEventStatus(event, now = Date.now()) {
  if (!event) return null;
  const next = deriveScheduledStatus(event, now);
  if (next === event.status) return event;
  return eventRepository.update(event.id, { status: next });
}

async function addViewerAccess(event, actor) {
  if (!event) return null;
  if (!actor || isStaff(actor) || event.visibility === 'PUBLIC') {
    return { ...event, viewerInvited: false };
  }

  const viewerInvited = await eventParticipantsRepository.isInvited(event.id, actor.id);
  return viewerInvited ? { ...event, viewerInvited: true } : null;
}

function resolveListArgs(actorOrNow, maybeNow) {
  if (typeof actorOrNow === 'number') return { actor: null, now: actorOrNow };
  return { actor: actorOrNow || null, now: maybeNow ?? Date.now() };
}

function resolveGetArgs(actorOrNow, maybeNow) {
  if (typeof actorOrNow === 'number') return { actor: null, now: actorOrNow };
  return { actor: actorOrNow || null, now: maybeNow ?? Date.now() };
}

export const eventService = {
  async listEvents(actorOrNow = null, maybeNow) {
    const { actor, now } = resolveListArgs(actorOrNow, maybeNow);
    const events = await eventRepository.findAll();
    const visible = [];

    for (const event of events) {
      const reconciled = await reconcileEventStatus(event, now);
      const accessible = await addViewerAccess(reconciled, actor);
      if (accessible) visible.push(accessible);
    }

    return visible;
  },

  async getEvent(id, actorOrNow = null, maybeNow) {
    const { actor, now } = resolveGetArgs(actorOrNow, maybeNow);
    const event = await eventRepository.findById(id);
    if (!event) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');

    const reconciled = await reconcileEventStatus(event, now);
    const accessible = await addViewerAccess(reconciled, actor);
    if (!accessible) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');
    return accessible;
  },

  async createEvent(data, actor) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can create events.');
    if (new Date(data.endAt) <= new Date(data.startAt)) {
      throw fail(400, 'INVALID_EVENT_WINDOW', 'Event end must be after its start.');
    }

    const event = await eventRepository.create({
      ...data,
      visibility: data.visibility || 'PUBLIC',
      status: data.status || 'DRAFT',
      createdBy: actor.id,
    });

    await auditService.log({
      actorId: actor.id,
      action: 'EVENT_CREATED',
      entityType: 'EVENT',
      entityId: event.id,
      metadata: { name: event.name, status: event.status, visibility: event.visibility },
    });

    return event;
  },

  async updateEvent(id, data, actor) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can edit events.');

    const current = await eventRepository.findById(id);
    if (!current) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');

    if (['CLOSED', 'CANCELLED'].includes(current.status) && data.status === 'OPEN') {
      throw fail(409, 'INVALID_EVENT_TRANSITION', 'Closed or cancelled events cannot be reopened.');
    }

    const start = data.startAt || current.startAt;
    const end = data.endAt || current.endAt;
    if (new Date(end) <= new Date(start)) {
      throw fail(400, 'INVALID_EVENT_WINDOW', 'Event end must be after its start.');
    }

    const event = await eventRepository.update(id, data);
    await auditService.log({
      actorId: actor.id,
      action: 'EVENT_UPDATED',
      entityType: 'EVENT',
      entityId: id,
      metadata: { fields: Object.keys(data), status: event.status, visibility: event.visibility },
    });
    return reconcileEventStatus(event);
  },
};

export default eventService;
