import { eventParticipantsRepository } from '../repositories/eventParticipants.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { auditService } from './audit.service.js';

const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

export const eventParticipantsService = {
  async invite({ eventId, userIds, actor }) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can invite participants.');
    const event = await eventRepository.findById(eventId);
    if (!event) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');
    if (event.visibility !== 'INVITE_ONLY') {
      throw fail(409, 'EVENT_IS_PUBLIC', 'Public events do not use required participant invitations.');
    }

    const uniqueIds = [...new Set(userIds)];
    const participants = await eventParticipantsRepository.invite({ eventId, userIds: uniqueIds, invitedBy: actor.id });
    await auditService.log({
      actorId: actor.id,
      action: 'PARTICIPANTS_INVITED',
      entityType: 'EVENT',
      entityId: eventId,
      metadata: { count: uniqueIds.length },
    });
    return participants;
  },

  async list({ eventId, actor }) {
    if (!['ADMIN', 'OPERATOR'].includes(actor?.role)) throw fail(403, 'FORBIDDEN', 'Only staff can view participants.');
    const event = await eventRepository.findById(eventId);
    if (!event) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');
    return eventParticipantsRepository.findByEvent(eventId);
  },
};

export default eventParticipantsService;
