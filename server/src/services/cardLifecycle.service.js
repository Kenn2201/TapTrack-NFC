import { nfcCardRepository } from '../repositories/nfcCard.repository.js';
import { nfcCredentialService } from './nfcCredential.service.js';
import { auditService } from './audit.service.js';

export const CARD_TRANSITIONS = Object.freeze({
  ACTIVE: ['LOST', 'REVOKED', 'DISABLED'],
  LOST: ['REPLACED'],
  REVOKED: ['REPLACED'],
  DISABLED: ['ACTIVE'],
  UNASSIGNED: [],
  REPLACED: [],
});
const fail = (status, code, message, options = {}) => Object.assign(new Error(message), { status, code, ...options });

/**
 * Map known database errors to safe, human-readable client errors.
 * 22001 = value too long for a VARCHAR column (revocation_reason is VARCHAR(100)).
 */
function mapDbError(err) {
  if (err?.code === '22001') {
    return fail(400, 'REASON_TOO_LONG', 'Reason cannot exceed 100 characters.');
  }

  // A lifecycle write can only use statuses supported by the deployed database
  // schema. Older/partially migrated databases surface these PostgreSQL errors
  // as generic 500s unless we translate them explicitly.
  if (err?.code === '22P02' || err?.code === '23514') {
    return fail(
      503,
      'CARD_LIFECYCLE_SCHEMA_MISMATCH',
      'Card lifecycle storage is not compatible with this status yet. Verify the deployed database migrations before retrying.',
      { expose: true }
    );
  }
  if (err?.code === '42703' || err?.code === '42P01') {
    return fail(
      503,
      'CARD_LIFECYCLE_SCHEMA_INCOMPLETE',
      'Card lifecycle storage is incomplete on this deployment. Verify the deployed database migrations before retrying.',
      { expose: true }
    );
  }

  return err;
}

export const cardLifecycleService = {
  async transition({ cardId, targetStatus, actor, reason }) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can manage card lifecycle.');
    const card = await nfcCardRepository.findById(cardId);
    if (!card) throw fail(404, 'CARD_NOT_FOUND', 'NFC card not found.');
    if (!(CARD_TRANSITIONS[card.status] || []).includes(targetStatus)) {
      throw fail(409, 'INVALID_CARD_TRANSITION', `Card cannot transition from ${card.status} to ${targetStatus}.`);
    }
    const trimmedReason = reason?.trim() || null;
    if (['LOST', 'REVOKED', 'DISABLED'].includes(targetStatus) && !trimmedReason) {
      throw fail(400, 'REASON_REQUIRED', 'A lifecycle reason is required.');
    }
    if (trimmedReason && trimmedReason.length > 100) {
      throw fail(400, 'REASON_TOO_LONG', 'Reason cannot exceed 100 characters.');
    }
    let updated;
    try {
      updated = targetStatus === 'ACTIVE'
        ? await nfcCardRepository.activateExclusive(cardId)
        : await nfcCardRepository.updateLifecycle(cardId, {
            status: targetStatus,
            actorId: actor.id,
            reason: trimmedReason,
          });
    } catch (dbErr) {
      throw mapDbError(dbErr);
    }
    if (!updated) throw fail(404, 'CARD_NOT_FOUND', 'NFC card not found.');
    await auditService.log({ actorId: actor.id, action: `CARD_${targetStatus}`, entityType: 'NFC_CARD', entityId: cardId, metadata: { from: card.status, to: targetStatus, reason: trimmedReason } });

    // UPDATE ... RETURNING * does not include joined user/issuer fields.
    // Re-fetch the canonical record so lifecycle responses use the same safe
    // shape as card list/detail responses.
    const canonical = await nfcCardRepository.findById(cardId);
    return nfcCredentialService.formatSafeCard(canonical || updated);
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
    let replacement;
    try {
      replacement = await nfcCardRepository.replaceCard({
        oldCardId: cardId, cardLabel: newCardLabel.trim().toUpperCase(), userId: oldCard.userId,
        tokenHash, actorId: actor.id, reason: reason?.trim() || 'Card replaced',
      });
    } catch (dbErr) {
      throw mapDbError(dbErr);
    }
    await auditService.log({ actorId: actor.id, action: 'CARD_REPLACED', entityType: 'NFC_CARD', entityId: cardId, metadata: { replacementCardId: replacement.newCard.id, reason: reason?.trim() || 'Card replaced' } });
    return {
      oldCard: nfcCredentialService.formatSafeCard(replacement.oldCard),
      newCard: nfcCredentialService.formatSafeCard(replacement.newCard),
      rawToken,
      writeUrl: nfcCredentialService.buildWriteUrl(rawToken),
    };
  },

  async reissue({ cardId, actor, reason }) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can reissue cards.');
    const oldCard = await nfcCardRepository.findById(cardId);
    if (!oldCard) throw fail(404, 'CARD_NOT_FOUND', 'NFC card not found.');
    if (!(CARD_TRANSITIONS[oldCard.status] || []).includes('REPLACED')) {
      throw fail(409, 'INVALID_CARD_TRANSITION', `Card cannot transition from ${oldCard.status} to REPLACED.`);
    }
    if (!oldCard.userId) throw fail(409, 'CARD_UNASSIGNED', 'Only an assigned card can be reissued.');
    const rawToken = nfcCredentialService.generateRawCredential();
    const tokenHash = nfcCredentialService.deriveCredentialHash(rawToken);
    let replacement;
    try {
      replacement = await nfcCardRepository.replaceCard({
        oldCardId: cardId, cardLabel: oldCard.cardLabel, userId: oldCard.userId,
        tokenHash, actorId: actor.id, reason: reason?.trim() || 'Card reissued',
      });
    } catch (dbErr) {
      throw mapDbError(dbErr);
    }
    await auditService.log({ actorId: actor.id, action: 'CARD_REISSUED', entityType: 'NFC_CARD', entityId: cardId, metadata: { replacementCardId: replacement.newCard.id, reason: reason?.trim() || 'Card reissued' } });
    return {
      oldCard: nfcCredentialService.formatSafeCard(replacement.oldCard),
      newCard: nfcCredentialService.formatSafeCard(replacement.newCard),
      rawToken,
      writeUrl: nfcCredentialService.buildWriteUrl(rawToken),
    };
  },
};
