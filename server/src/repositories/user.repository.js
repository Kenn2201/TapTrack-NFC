import pool from './db.js';

const USER_COLUMNS = `
  id, email, password_hash, first_name, last_name, nickname, birthday, avatar_url,
  role, status, email_verified_at, created_at, updated_at,
  last_login_at, last_seen_at, session_version
`;

const ADMIN_USER_COLUMNS = `
  id, email, first_name, last_name, nickname, birthday, avatar_url,
  role, status, email_verified_at, created_at, updated_at, last_login_at, last_seen_at
`;

export const userRepository = {
  /**
   * Find user by normalized email (case-insensitive)
   */
  async findByEmail(email) {
    const query = `
      SELECT ${USER_COLUMNS}
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const result = await pool.query(query, [email.trim()]);
    return result.rows[0] || null;
  },

  /**
   * Find user by primary ID
   */
  async findById(id) {
    const query = `
      SELECT ${USER_COLUMNS}
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Create a new user (always USER role by default)
   */
  async create({ email, passwordHash, firstName, lastName, nickname = null, role = 'USER', status = 'ACTIVE', emailVerifiedAt = null }) {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, nickname, role, status, email_verified_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING ${USER_COLUMNS};
    `;
    const result = await pool.query(query, [
      email.toLowerCase().trim(),
      passwordHash,
      firstName.trim(),
      lastName.trim(),
      nickname?.trim() || null,
      role,
      status,
      emailVerifiedAt,
    ]);
    return result.rows[0];
  },

  /**
   * One-active-session security: bump session_version and record login time.
   * Every new login invalidates all previously issued sessions.
   */
  async recordLogin(id) {
    const query = `
      UPDATE users
      SET session_version = session_version + 1,
          last_login_at = NOW(),
          last_seen_at = NOW()
      WHERE id = $1
      RETURNING ${USER_COLUMNS};
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Invalidate every active session for a user (logout, password change,
   * password reset, account disable).
   */
  async revokeAllSessions(id) {
    const query = `
      UPDATE users
      SET session_version = session_version + 1,
          updated_at = NOW()
      WHERE id = $1
      RETURNING ${USER_COLUMNS};
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Throttled last-seen heartbeat. Callers should only invoke when the stored
   * last_seen_at is older than the throttle window.
   */
  async touchLastSeen(id) {
    const query = `
      UPDATE users
      SET last_seen_at = NOW()
      WHERE id = $1;
    `;
    await pool.query(query, [id]);
  },

  /**
   * Update a user's role (USER <-> OPERATOR)
   */
  async updateRole(id, role) {
    const query = `
      UPDATE users
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING ${USER_COLUMNS};
    `;
    const result = await pool.query(query, [role, id]);
    return result.rows[0] || null;
  },

  /**
   * Update a user's status (ACTIVE <-> DISABLED). Disabling a user also
   * invalidates their active server-side sessions.
   */
  async updateStatus(id, status) {
    const query = `
      UPDATE users
      SET status = $1,
          session_version = CASE WHEN $1 = 'DISABLED' THEN session_version + 1 ELSE session_version END,
          updated_at = NOW()
      WHERE id = $2
      RETURNING ${USER_COLUMNS};
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0] || null;
  },

  /**
   * Update user password hash and invalidate all active sessions
   */
  async updatePassword(id, passwordHash) {
    const query = `
      UPDATE users
      SET password_hash = $1, session_version = session_version + 1, updated_at = NOW()
      WHERE id = $2
      RETURNING ${USER_COLUMNS};
    `;
    const result = await pool.query(query, [passwordHash, id]);
    return result.rows[0] || null;
  },

  /**
   * Mark user's email as verified
   */
  async setEmailVerified(id) {
    const query = `
      UPDATE users
      SET email_verified_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING ${USER_COLUMNS};
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Update profile fields (names, nickname, birthday, avatar URL)
   */
  async updateProfile(id, { firstName, lastName, nickname, birthday, avatarUrl }) {
    const query = `
      UPDATE users
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          nickname = COALESCE($3, nickname),
          birthday = COALESCE($4::date, birthday),
          avatar_url = COALESCE($5, avatar_url),
          updated_at = NOW()
      WHERE id = $6
      RETURNING ${USER_COLUMNS};
    `;
    const result = await pool.query(query, [firstName?.trim(), lastName?.trim(), nickname?.trim() || null, birthday || null, avatarUrl?.trim() || null, id]);
    return result.rows[0] || null;
  },

  /**
   * List all users for admin management (never exposes password_hash)
   */
  async findAll() {
    const query = `
      SELECT ${ADMIN_USER_COLUMNS}
      FROM users
      ORDER BY id ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  /**
   * Full admin user detail (never exposes password_hash)
   */
  async findByIdSafe(id) {
    const query = `
      SELECT ${ADMIN_USER_COLUMNS}
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },
};

export default userRepository;