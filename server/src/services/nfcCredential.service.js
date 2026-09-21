import crypto from 'crypto';
import { config, getCardTokenPepper } from '../config/index.js';

/**
 * Centralized NFC Card Credential Service
 *
 * Security Model:
 * 1. Physical card stores the raw credential only inside a URL fragment:
 *    https://nfc.kenncode.me/t#<RAW_RANDOM_TOKEN>
 * 2. The # fragment prevents the token from appearing in HTTP access logs.
 * 3. Database stores ONLY the HMAC-SHA256 derived hash using CARD_TOKEN_PEPPER.
 * 4. Raw tokens are never persisted in the database and never logged in production.
 * 5. token_hash is never exposed to the client in safe card representations.
 */
export const nfcCredentialService = {
  /**
   * Generates an opaque, cryptographically random, high-entropy, URL-safe credential.
   * @returns {string} 24-byte base64url token (~32 characters)
   */
  generateRawCredential() {
    return crypto.randomBytes(24).toString('base64url');
  },

  /**
   * Derives a deterministic cryptographic hash from the raw token using CARD_TOKEN_PEPPER.
   * Ensures no default or fallback pepper is accepted.
   * @param {string} rawToken
   * @returns {string} 64-character hex hash suitable for VARCHAR(64)
   */
  deriveCredentialHash(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new Error('Raw card token is required for credential derivation.');
    }
    const pepper = getCardTokenPepper();
    return crypto.createHmac('sha256', pepper).update(rawToken).digest('hex');
  },

  /**
   * Builds the physical write URL containing the raw credential in the fragment (#).
   * @param {string} rawToken
   * @returns {string} https://nfc.kenncode.me/t#<RAW_TOKEN>
   */
  buildWriteUrl(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new Error('Raw card token is required to build write URL.');
    }
    const domain = config.nfcDomain.replace(/\/+$/, '');
    return `${domain}/t#${rawToken}`;
  },

  /**
   * Formats a card record into a safe client DTO, strictly stripping token_hash
   * and any internal cryptographic secrets.
   * @param {object} card
   * @returns {object|null}
   */
  formatSafeCard(card) {
    if (!card) return null;
    const { token_hash, ...safeCard } = card;
    return safeCard;
  },
};
