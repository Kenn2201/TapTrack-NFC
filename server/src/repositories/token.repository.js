import pool from './db.js';

export const tokenRepository = {
  // ─── EMAIL VERIFICATION TOKENS ──────────────────────────────────────────────

  /**
   * Save a hashed email verification token for a user
   */
  async createEmailVerificationToken({ userId, tokenHash, expiresAt }) {
    // Invalidate any existing unused tokens for this user first
    await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);

    const query = `
      INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, user_id, token_hash, expires_at, created_at;
    `;
    const result = await pool.query(query, [userId, tokenHash, expiresAt]);
    return result.rows[0];
  },

  /**
   * Find an active email verification token by its hash
   */
  async findEmailVerificationToken(tokenHash) {
    const query = `
      SELECT id, user_id, token_hash, expires_at, created_at
      FROM email_verification_tokens
      WHERE token_hash = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [tokenHash]);
    return result.rows[0] || null;
  },

  /**
   * Delete an email verification token by ID (one-time use invalidation)
   */
  async deleteEmailVerificationToken(id) {
    await pool.query('DELETE FROM email_verification_tokens WHERE id = $1', [id]);
  },

  // ─── PASSWORD RESET TOKENS ──────────────────────────────────────────────────

  /**
   * Save a hashed password reset token for a user
   */
  async createPasswordResetToken({ userId, tokenHash, expiresAt }) {
    // Invalidate any prior unused reset tokens for this user
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [userId]);

    const query = `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at, created_at)
      VALUES ($1, $2, $3, NULL, NOW())
      RETURNING id, user_id, token_hash, expires_at, used_at, created_at;
    `;
    const result = await pool.query(query, [userId, tokenHash, expiresAt]);
    return result.rows[0];
  },

  /**
   * Find an unused password reset token by hash
   */
  async findPasswordResetToken(tokenHash) {
    const query = `
      SELECT id, user_id, token_hash, expires_at, used_at, created_at
      FROM password_reset_tokens
      WHERE token_hash = $1 AND used_at IS NULL
      LIMIT 1;
    `;
    const result = await pool.query(query, [tokenHash]);
    return result.rows[0] || null;
  },

  /**
   * Mark a password reset token as used (one-time use invalidation)
   */
  async markPasswordResetTokenUsed(id) {
    const query = `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = $1
      RETURNING id, user_id, token_hash, expires_at, used_at;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },
};

export default tokenRepository;
