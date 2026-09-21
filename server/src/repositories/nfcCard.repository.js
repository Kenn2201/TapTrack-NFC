import pool from './db.js';

export const nfcCardRepository = {
  /**
   * Find a card by its unique physical label (e.g. NFC-001)
   */
  async findByCardLabel(cardLabel) {
    const query = `
      SELECT 
        c.id,
        c.card_label,
        c.user_id,
        c.token_hash,
        c.status,
        c.issued_at,
        c.issued_by,
        c.activated_at,
        c.revoked_at,
        c.revoked_by,
        c.revocation_reason,
        c.replaced_by_card_id,
        c.last_used_at,
        c.created_at,
        c.updated_at,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name,
        u.role AS user_role,
        u.status AS user_status
      FROM nfc_cards c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE UPPER(c.card_label) = UPPER($1)
      LIMIT 1;
    `;
    const result = await pool.query(query, [cardLabel.trim()]);
    return result.rows[0] ? this._mapRow(result.rows[0]) : null;
  },

  /**
   * Find a card by primary key ID
   */
  async findById(id) {
    const query = `
      SELECT 
        c.id,
        c.card_label,
        c.user_id,
        c.token_hash,
        c.status,
        c.issued_at,
        c.issued_by,
        c.activated_at,
        c.revoked_at,
        c.revoked_by,
        c.revocation_reason,
        c.replaced_by_card_id,
        c.last_used_at,
        c.created_at,
        c.updated_at,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name,
        u.role AS user_role,
        u.status AS user_status,
        ib.email AS issuer_email,
        ib.first_name AS issuer_first_name,
        ib.last_name AS issuer_last_name
      FROM nfc_cards c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users ib ON c.issued_by = ib.id
      WHERE c.id = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] ? this._mapRow(result.rows[0]) : null;
  },

  /**
   * Find a card by its derived token hash
   */
  async findByTokenHash(tokenHash) {
    const query = `
      SELECT 
        c.id,
        c.card_label,
        c.user_id,
        c.token_hash,
        c.status,
        c.issued_at,
        c.issued_by,
        c.activated_at,
        c.revoked_at,
        c.revoked_by,
        c.revocation_reason,
        c.replaced_by_card_id,
        c.last_used_at,
        c.created_at,
        c.updated_at,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name,
        u.role AS user_role,
        u.status AS user_status
      FROM nfc_cards c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.token_hash = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [tokenHash]);
    return result.rows[0] ? this._mapRow(result.rows[0]) : null;
  },

  /**
   * Find active card assigned to a given user
   */
  async findActiveByUserId(userId) {
    const query = `
      SELECT 
        c.id,
        c.card_label,
        c.user_id,
        c.token_hash,
        c.status,
        c.issued_at,
        c.issued_by,
        c.activated_at,
        c.revoked_at,
        c.revoked_by,
        c.revocation_reason,
        c.replaced_by_card_id,
        c.last_used_at,
        c.created_at,
        c.updated_at
      FROM nfc_cards c
      WHERE c.user_id = $1 AND c.status = 'ACTIVE'
      LIMIT 1;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] ? this._mapRow(result.rows[0]) : null;
  },

  /**
   * List all cards with optional filtering by status or search keyword
   */
  async findAll({ status = null, search = null } = {}) {
    let query = `
      SELECT 
        c.id,
        c.card_label,
        c.user_id,
        c.token_hash,
        c.status,
        c.issued_at,
        c.issued_by,
        c.activated_at,
        c.revoked_at,
        c.revoked_by,
        c.revocation_reason,
        c.replaced_by_card_id,
        c.last_used_at,
        c.created_at,
        c.updated_at,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name,
        u.role AS user_role,
        u.status AS user_status
      FROM nfc_cards c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      const idx = params.length;
      query += ` AND (c.card_label ILIKE $${idx} OR u.email ILIKE $${idx} OR u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx})`;
    }

    query += ` ORDER BY c.id ASC;`;

    const result = await pool.query(query, params);
    return result.rows.map((row) => this._mapRow(row));
  },

  /**
   * Create a new NFC card record with derived token hash
   */
  async create({ cardLabel, userId, tokenHash, status = 'UNASSIGNED', issuedBy = null, issuedAt = new Date() }) {
    const query = `
      INSERT INTO nfc_cards (
        card_label,
        user_id,
        token_hash,
        status,
        issued_by,
        issued_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING 
        id,
        card_label,
        user_id,
        token_hash,
        status,
        issued_by,
        issued_at,
        activated_at,
        revoked_at,
        revoked_by,
        revocation_reason,
        replaced_by_card_id,
        last_used_at,
        created_at,
        updated_at;
    `;
    const result = await pool.query(query, [
      cardLabel.trim(),
      userId || null,
      tokenHash,
      status,
      issuedBy || null,
      issuedAt,
    ]);
    return this._mapRow(result.rows[0]);
  },

  /**
   * Update card status and lifecycle timestamps
   */
  async updateStatus(id, { status, activatedAt = null, revokedAt = null, revokedBy = null, revocationReason = null }) {
    const query = `
      UPDATE nfc_cards
      SET 
        status = $1,
        activated_at = COALESCE($2, activated_at),
        revoked_at = COALESCE($3, revoked_at),
        revoked_by = COALESCE($4, revoked_by),
        revocation_reason = COALESCE($5, revocation_reason),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    const result = await pool.query(query, [
      status,
      activatedAt,
      revokedAt,
      revokedBy,
      revocationReason,
      id,
    ]);
    return result.rows[0] ? this._mapRow(result.rows[0]) : null;
  },

  /**
   * Assign or reassign card to a user
   */
  async assignUser(id, userId) {
    const query = `
      UPDATE nfc_cards
      SET 
        user_id = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, id]);
    return result.rows[0] ? this._mapRow(result.rows[0]) : null;
  },

  async updateLifecycle(id, { status, actorId, reason }) {
    const result = await pool.query(`
      UPDATE nfc_cards SET status = $1,
        revoked_at = CASE WHEN $1 IN ('LOST', 'REVOKED', 'DISABLED') THEN NOW() ELSE revoked_at END,
        revoked_by = CASE WHEN $1 IN ('LOST', 'REVOKED', 'DISABLED') THEN $2 ELSE revoked_by END,
        revocation_reason = CASE WHEN $1 IN ('LOST', 'REVOKED', 'DISABLED') THEN $3 ELSE revocation_reason END,
        updated_at = NOW()
      WHERE id = $4 RETURNING *;
    `, [status, actorId, reason, id]);
    return result.rows[0] ? this._mapRow(result.rows[0]) : null;
  },

  async replaceCard({ oldCardId, cardLabel, userId, tokenHash, actorId, reason }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const created = await client.query(`
        INSERT INTO nfc_cards (card_label, user_id, token_hash, status, issued_by, issued_at, created_at, updated_at)
        VALUES ($1, $2, $3, 'UNASSIGNED', $4, NOW(), NOW(), NOW()) RETURNING *;
      `, [cardLabel, userId, tokenHash, actorId]);
      const updated = await client.query(`
        UPDATE nfc_cards SET status = 'REPLACED', replaced_by_card_id = $1,
          revoked_at = NOW(), revoked_by = $2, revocation_reason = $3, updated_at = NOW()
        WHERE id = $4 AND status IN ('LOST', 'REVOKED') RETURNING *;
      `, [created.rows[0].id, actorId, reason, oldCardId]);
      if (!updated.rows[0]) throw Object.assign(new Error('Card replacement state changed.'), { code: 'CARD_STATE_CHANGED', status: 409 });
      await client.query('COMMIT');
      return { oldCard: this._mapRow(updated.rows[0]), newCard: this._mapRow(created.rows[0]) };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Helper to normalize database rows into a structured object
   */
  _mapRow(row) {
    const card = {
      id: row.id,
      cardLabel: row.card_label,
      userId: row.user_id,
      token_hash: row.token_hash, // Keep for repository/service internal use; stripped before client serialization
      status: row.status,
      issuedAt: row.issued_at,
      issuedBy: row.issued_by,
      activatedAt: row.activated_at,
      revokedAt: row.revoked_at,
      revokedBy: row.revoked_by,
      revocationReason: row.revocation_reason,
      replacedByCardId: row.replaced_by_card_id,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (row.user_email) {
      card.assignedUser = {
        id: row.user_id,
        email: row.user_email,
        firstName: row.user_first_name,
        lastName: row.user_last_name,
        role: row.user_role,
        status: row.user_status,
      };
    } else {
      card.assignedUser = null;
    }

    if (row.issuer_email) {
      card.issuer = {
        id: row.issued_by,
        email: row.issuer_email,
        firstName: row.issuer_first_name,
        lastName: row.issuer_last_name,
      };
    }

    return card;
  },
};
