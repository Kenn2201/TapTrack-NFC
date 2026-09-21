// Credential service — NFC token generation and verification
import crypto from 'node:crypto';

export const credentialService = {
  generateToken() {
    const rawToken = crypto.randomBytes(24).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
  },

  hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  },
};
