import { nfcCardRepository } from '../repositories/nfcCard.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { nfcCredentialService } from './nfcCredential.service.js';

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
};
