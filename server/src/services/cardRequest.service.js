import { cardRequestRepository } from '../repositories/cardRequest.repository.js';
import { nfcCardRepository } from '../repositories/nfcCard.repository.js';
import { auditService } from './audit.service.js';

const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

export const cardRequestService = {
  async createForUser({ userId, requestType, note }) {
    const openRequest = await cardRequestRepository.findOpenByUserId(userId);
    if (openRequest) {
      throw fail(409, 'CARD_REQUEST_EXISTS', 'You already have an NFC setup or replacement request being reviewed.');
    }

    const currentCard = await nfcCardRepository.findLatestByUserId(userId);
    const expectedType = currentCard ? 'REPLACEMENT' : 'SETUP';
    if (requestType !== expectedType) {
      throw fail(
        409,
        'CARD_REQUEST_TYPE_MISMATCH',
        currentCard
          ? 'Your account already has card history. Submit a replacement request instead.'
          : 'Your account does not have a card yet. Submit a setup request instead.'
      );
    }

    const request = await cardRequestRepository.create({
      userId,
      cardId: currentCard?.id || null,
      requestType,
      note: note?.trim() || null,
    });

    await auditService.log({
      actorId: userId,
      action: 'CARD_REQUEST_CREATED',
      entityType: 'CARD_REQUEST',
      entityId: request.id,
      metadata: { requestType },
    });

    return request;
  },

  listMine(userId) {
    return cardRequestRepository.listByUser(userId);
  },

  async listAll({ status }, actor) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Administrator access required.');
    return cardRequestRepository.listAll({ status });
  },

  async updateStatus({ id, status, adminNote, actor }) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Administrator access required.');
    const existing = await cardRequestRepository.findById(id);
    if (!existing) throw fail(404, 'CARD_REQUEST_NOT_FOUND', 'Card request not found.');

    const updated = await cardRequestRepository.updateStatus(id, {
      status,
      adminNote: adminNote?.trim() || null,
      actorId: actor.id,
    });

    await auditService.log({
      actorId: actor.id,
      action: 'CARD_REQUEST_STATUS_CHANGED',
      entityType: 'CARD_REQUEST',
      entityId: id,
      metadata: { from: existing.status, to: status, requestType: existing.requestType },
    });

    return updated;
  },
};

export default cardRequestService;
