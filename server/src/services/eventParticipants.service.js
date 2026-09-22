import { eventParticipantsRepository } from '../repositories/eventParticipants.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { auditService } from './audit.service.js';

const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

export const eventParticipantsService = {
  async invite({ eventId, userIds, actor }) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can invite participants.');
    const event = await eventRepository.findById(eventId);
    if (!event) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');
    const uniqueIds = [...new Set(userIds)];
    const participants = await eventParticipantsRepository.invite({ eventId, userIds: uniqueIds, invitedBy: actor.id });
    await auditService.log({ actorId: actor.id, action: 'PARTICIPANTS_INVITED', entityType: 'EVENT', entityId: eventId, metadata: { count: uniqueIds.length } });
    return participants;
  },

  async list({ eventId, actor }) {
    if (!['ADMIN', 'OPERATOR'].includes(actor?.role)) throw fail(403, 'FORBIDDEN', 'Only staff can view participants.');
    const event = await eventRepository.findById(eventId);
    if (!event) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');
    return eventParticipantsRepository.findByEvent(eventId);
  },

  async rsvp({ eventId, userId, status, actor }) {
    const participant = await eventParticipantsRepository.findByEventAndUser(eventId, userId);
    if (!participant) throw fail(404, 'NOT_INVITED', 'Only invited users may RSVP to an event.');
    const updated = await eventParticipantsRepository.rsvp(eventId, userId, status);
    await auditService.log({ actorId: actor.id, action: 'PARTICIPANT_RSVP', entityType: 'EVENT', entityId: eventId, metadata: { status } });
    return updated;
  },
};

export default eventParticipantsService;
