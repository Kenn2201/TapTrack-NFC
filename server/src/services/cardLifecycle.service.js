import { nfcCardRepository } from '../repositories/nfcCard.repository.js';
import { nfcCredentialService } from './nfcCredential.service.js';

export const CARD_TRANSITIONS = Object.freeze({
  ACTIVE: ['LOST', 'REVOKED', 'DISABLED'],
  LOST: ['REPLACED'],
  REVOKED: ['REPLACED'],
  DISABLED: ['ACTIVE'],
  UNASSIGNED: [],
  REPLACED: [],
});
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

export const cardLifecycleService = {
  async transition({ cardId, targetStatus, actor, reason }) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can manage card lifecycle.');
    const card = await nfcCardRepository.findById(cardId);
    if (!card) throw fail(404, 'CARD_NOT_FOUND', 'NFC card not found.');
    if (!(CARD_TRANSITIONS[card.status] || []).includes(targetStatus)) {
      throw fail(409, 'INVALID_CARD_TRANSITION', `Card cannot transition from ${card.status} to ${targetStatus}.`);
    }
    if (['LOST', 'REVOKED', 'DISABLED'].includes(targetStatus) && !reason?.trim()) {
      throw fail(400, 'REASON_REQUIRED', 'A lifecycle reason is required.');
    }
    const updated = await nfcCardRepository.updateLifecycle(cardId, {
      status: targetStatus,
      actorId: actor.id,
      reason: reason?.trim() || null,
    });
    return nfcCredentialService.formatSafeCard(updated);
  },

  async replace({ cardId, newCardLabel, actor, reason }) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can replace cards.');
    const oldCard = await nfcCardRepository.findById(cardId);
    if (!oldCard) throw fail(404, 'CARD_NOT_FOUND', 'NFC card not found.');
    if (!(CARD_TRANSITIONS[oldCard.status] || []).includes('REPLACED')) {
      throw fail(409, 'INVALID_CARD_TRANSITION', `Card cannot transition from ${oldCard.status} to REPLACED.`);
    }
    if (!oldCard.userId) throw fail(409, 'CARD_UNASSIGNED', 'Only an assigned card can be replaced.');
    if (await nfcCardRepository.findByCardLabel(newCardLabel)) throw fail(409, 'CARD_LABEL_EXISTS', 'Replacement card label already exists.');
    const rawToken = nfcCredentialService.generateRawCredential();
    const tokenHash = nfcCredentialService.deriveCredentialHash(rawToken);
    const replacement = await nfcCardRepository.replaceCard({
      oldCardId: cardId, cardLabel: newCardLabel.trim().toUpperCase(), userId: oldCard.userId,
      tokenHash, actorId: actor.id, reason: reason?.trim() || 'Card replaced',
    });
    return {
      oldCard: nfcCredentialService.formatSafeCard(replacement.oldCard),
      newCard: nfcCredentialService.formatSafeCard(replacement.newCard),
      rawToken,
      writeUrl: nfcCredentialService.buildWriteUrl(rawToken),
    };
  },
};
