import { nfcCardRepository } from '../repositories/nfcCard.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { nfcCredentialService } from './nfcCredential.service.js';
import { auditService } from './audit.service.js';

export const nfcCardService = {
  /**
   * List all cards with safe metadata (strips token_hash)
   */
  async listCards({ status, search } = {}) {
    const cards = await nfcCardRepository.findAll({ status, search });
    return cards.map((c) => nfcCredentialService.formatSafeCard(c));
  },

  /**
   * Get card details by ID (strips token_hash)
   */
  async getCardById(id) {
    const card = await nfcCardRepository.findById(id);
    if (!card) {
      const err = new Error('NFC card not found.');
      err.status = 404;
      throw err;
    }
    return nfcCredentialService.formatSafeCard(card);
  },

  async getUserCard(userId) {
    const card = await nfcCardRepository.findLatestByUserId(userId);
    return nfcCredentialService.formatSafeCard(card);
  },

  /**
   * Provision a physical NFC card:
   * 1. Validates physical label uniqueness (e.g. NFC-001)
   * 2. Validates assigned user exists and is ACTIVE
   * 3. Generates high-entropy opaque random credential
   * 4. Derives cryptographic hash with CARD_TOKEN_PEPPER
   * 5. Persists ONLY derived token_hash in database
   * 6. Returns raw write URL exactly once to ADMIN
   */
  async provisionCard({ cardLabel, userId, actorId }) {
    if (!cardLabel || typeof cardLabel !== 'string') {
      const err = new Error('Card label is required.');
      err.status = 400;
      throw err;
    }

    const trimmedLabel = cardLabel.trim().toUpperCase();

    // Check duplicate label
    const existingCard = await nfcCardRepository.findByCardLabel(trimmedLabel);
    if (existingCard) {
      const err = new Error(`A card with label "${trimmedLabel}" already exists.`);
      err.status = 409;
      throw err;
    }

    // Validate assigned user if provided
    let assignedUser = null;
    if (userId) {
      assignedUser = await userRepository.findById(userId);
      if (!assignedUser) {
        const err = new Error('Assigned user not found.');
        err.status = 404;
        throw err;
      }
      if (assignedUser.status !== 'ACTIVE') {
        const err = new Error('Cannot assign a card to a disabled user account.');
        err.status = 400;
        throw err;
      }
    }

    // Generate opaque raw credential and derive hash
    const rawToken = nfcCredentialService.generateRawCredential();
    const tokenHash = nfcCredentialService.deriveCredentialHash(rawToken);
    const writeUrl = nfcCredentialService.buildWriteUrl(rawToken);

    // Save to database with UNASSIGNED status until physically written and verified
    const createdCard = await nfcCardRepository.create({
      cardLabel: trimmedLabel,
      userId: userId || null,
      tokenHash,
      status: 'UNASSIGNED',
      issuedBy: actorId,
      issuedAt: new Date(),
    });

    // Populate assigned user info on the response if available
    if (assignedUser) {
      createdCard.assignedUser = {
        id: assignedUser.id,
        email: assignedUser.email,
        firstName: assignedUser.first_name,
        lastName: assignedUser.last_name,
        role: assignedUser.role,
        status: assignedUser.status,
      };
    }

    await auditService.log({ actorId, action: 'CARD_PROVISIONED', entityType: 'NFC_CARD', entityId: createdCard.id, metadata: { cardLabel: trimmedLabel, userId: userId || null } });

    return {
      card: nfcCredentialService.formatSafeCard(createdCard),
      rawToken, // Provided ONLY during provisioning response for writing to physical tag
      writeUrl, // https://nfc.kenncode.me/t#<RAW_TOKEN>
      instructions: [
        '1. Copy the generated write URL below.',
        '2. Open the NFC Tools app on your NFC-capable smartphone.',
        '3. Select "Write" -> "Add a record" -> "URL / URI".',
        '4. Paste the complete URL (including the # fragment) and write to your NTAG215 card.',
        '5. Read back the card with NFC Tools to confirm the stored URL matches exactly.',
        '6. Return to TapTrack and confirm the write to activate the card.',
      ],
    };
  },

  /**
   * Activate an unassigned card after physical write confirmation
   */
  async activateCard(id, { actorId, confirmWritten }) {
    if (!confirmWritten) {
      const err = new Error('You must confirm that the physical card was written and verified with NFC Tools.');
      err.status = 400;
      throw err;
    }

    const card = await nfcCardRepository.findById(id);
    if (!card) {
      const err = new Error('NFC card not found.');
      err.status = 404;
      throw err;
    }

    if (card.status === 'ACTIVE') {
      const err = new Error('Card is already active.');
      err.status = 400;
      throw err;
    }

    if (card.status !== 'UNASSIGNED') {
      const err = new Error(`Cannot activate a card with status "${card.status}". Only UNASSIGNED cards can be activated.`);
      err.status = 400;
      throw err;
    }

    if (!card.userId) {
      const err = new Error('Card must have an assigned user before activation.');
      err.status = 400;
      throw err;
    }

    // Verify assigned user is still active
    const user = await userRepository.findById(card.userId);
    if (!user || user.status !== 'ACTIVE') {
      const err = new Error('Assigned user account is disabled or no longer exists.');
      err.status = 400;
      throw err;
    }

    const updatedCard = await nfcCardRepository.updateStatus(id, {
      status: 'ACTIVE',
      activatedAt: new Date(),
    });

    await auditService.log({ actorId, action: 'CARD_ACTIVATED', entityType: 'NFC_CARD', entityId: id, metadata: { cardLabel: card.cardLabel } });

    return nfcCredentialService.formatSafeCard(updatedCard);
  },

  /**
   * Assign or reassign card to a user
   */
  async assignCard(id, { userId, actorId }) {
    const card = await nfcCardRepository.findById(id);
    if (!card) {
      const err = new Error('NFC card not found.');
      err.status = 404;
      throw err;
    }

    if (['REVOKED', 'LOST', 'DISABLED', 'REPLACED'].includes(card.status)) {
      const err = new Error(`Cannot reassign a card with status "${card.status}".`);
      err.status = 400;
      throw err;
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('Target user not found.');
      err.status = 404;
      throw err;
    }

    if (user.status !== 'ACTIVE') {
      const err = new Error('Cannot assign a card to a disabled user account.');
      err.status = 400;
      throw err;
    }

    const updatedCard = await nfcCardRepository.assignUser(id, userId);
    return nfcCredentialService.formatSafeCard(updatedCard);
  },

  /**
   * Public validated card lookup for attendance and verification.
   * Enforces HMAC-SHA256 derivation, card status, and assigned user status.
   */
  async validateActiveCard(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      const err = new Error('Raw card token is required for verification.');
      err.status = 400;
      err.code = 'INVALID_TOKEN';
      throw err;
    }

    const tokenHash = nfcCredentialService.deriveCredentialHash(rawToken);
    const card = await nfcCardRepository.findByTokenHash(tokenHash);

    if (!card) {
      const err = new Error('Card not found or unrecognized credential.');
      err.status = 404;
      err.code = 'CARD_NOT_FOUND';
      throw err;
    }

    if (card.status !== 'ACTIVE') {
      const statusErrors = {
        UNASSIGNED: { status: 400, code: 'CARD_UNASSIGNED', message: 'Card has not been activated yet.' },
        LOST: { status: 400, code: 'CARD_LOST', message: 'Card has been reported lost.' },
        REVOKED: { status: 400, code: 'CARD_REVOKED', message: 'Card has been revoked.' },
        REPLACED: { status: 400, code: 'CARD_REPLACED', message: 'Card has been replaced by another card.' },
        DISABLED: { status: 400, code: 'CARD_DISABLED', message: 'Card is permanently disabled.' },
      };
      const info = statusErrors[card.status] || { status: 400, code: 'CARD_INACTIVE', message: `Card is ${card.status.toLowerCase()}.` };
      const err = new Error(info.message);
      err.status = info.status;
      err.code = info.code;
      throw err;
    }

    if (!card.userId || !card.assignedUser) {
      const err = new Error('Card has no assigned member.');
      err.status = 400;
      err.code = 'MEMBER_NOT_ASSIGNED';
      throw err;
    }

    if (card.assignedUser.status !== 'ACTIVE') {
      const err = new Error('Assigned member account is disabled or inactive.');
      err.status = 400;
      err.code = 'MEMBER_INACTIVE';
      throw err;
    }

    return card;
  },

  /**
   * Internal alias kept for existing verify/resolve call sites.
   */
  async _lookupAndValidateCard(rawToken) {
    return this.validateActiveCard(rawToken);
  },

  /**
   * Verify an NFC card by its raw token for authorized operators/admins (v0.4.0 ALPHA)
   */
  async verifyCardToken(rawToken) {
    const card = await this.validateActiveCard(rawToken);
    const displayName = `${card.assignedUser.firstName || ''} ${card.assignedUser.lastName || ''}`.trim() || card.assignedUser.email;

    return {
      valid: true,
      card: {
        cardLabel: card.cardLabel,
        status: card.status,
      },
      member: {
        displayName,
        email: card.assignedUser.email,
      },
    };
  },

  /**
   * Resolve an NFC card credential for universal /t#token fallback (v0.5.0 ALPHA)
   * Card-holder-facing or public OS NFC resolution.
   * Public consumers receive a minimal privacy-preserving response (no email).
   * Authenticated operators/admins receive full details.
   * Strictly read-only: does NOT create attendance, sessions, or touch database.
   */
  async resolveCardToken(rawToken, { isOperatorOrAdmin = false } = {}) {
    const card = await this.validateActiveCard(rawToken);

    if (isOperatorOrAdmin) {
      const displayName = `${card.assignedUser.firstName || ''} ${card.assignedUser.lastName || ''}`.trim() || card.assignedUser.email;
      return {
        valid: true,
        card: {
          cardLabel: card.cardLabel,
          status: card.status,
        },
        member: {
          displayName,
          email: card.assignedUser.email,
        },
        isPublic: false,
      };
    }

    // Public resolution: minimal privacy-preserving display (no email)
    const publicDisplayName = card.assignedUser.firstName
      ? `${card.assignedUser.firstName} ${card.assignedUser.lastName ? card.assignedUser.lastName[0] + '.' : ''}`.trim()
      : 'Assigned Member';

    return {
      valid: true,
      card: {
        cardLabel: card.cardLabel,
        status: card.status,
      },
      member: {
        displayName: publicDisplayName,
      },
      isPublic: true,
    };
  },
};
