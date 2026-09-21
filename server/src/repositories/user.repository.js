import pool from './db.js';

export const userRepository = {
  /**
   * Find user by normalized email (case-insensitive)
   */
  async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, role, status, email_verified_at, created_at, updated_at
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
      SELECT id, email, password_hash, first_name, last_name, role, status, email_verified_at, created_at, updated_at
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
  async create({ email, passwordHash, firstName, lastName, role = 'USER', status = 'ACTIVE', emailVerifiedAt = null }) {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, email, first_name, last_name, role, status, email_verified_at, created_at, updated_at;
    `;
    const result = await pool.query(query, [
      email.toLowerCase().trim(),
      passwordHash,
      firstName.trim(),
      lastName.trim(),
      role,
      status,
      emailVerifiedAt,
    ]);
    return result.rows[0];
  },

  /**
   * Update a user's role (USER <-> OPERATOR)
   */
  async updateRole(id, role) {
    const query = `
      UPDATE users
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, first_name, last_name, role, status, email_verified_at, created_at, updated_at;
    `;
    const result = await pool.query(query, [role, id]);
    return result.rows[0] || null;
  },

  /**
   * Update a user's status (ACTIVE <-> DISABLED)
   */
  async updateStatus(id, status) {
    const query = `
      UPDATE users
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, first_name, last_name, role, status, email_verified_at, created_at, updated_at;
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0] || null;
  },

  /**
   * Update user password hash
   */
  async updatePassword(id, passwordHash) {
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, first_name, last_name, role, status, email_verified_at, created_at, updated_at;
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
      RETURNING id, email, first_name, last_name, role, status, email_verified_at, created_at, updated_at;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Update profile fields (first_name, last_name only)
   */
  async updateProfile(id, { firstName, lastName }) {
    const query = `
      UPDATE users
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, email, first_name, last_name, role, status, email_verified_at, created_at, updated_at;
    `;
    const result = await pool.query(query, [firstName?.trim(), lastName?.trim(), id]);
    return result.rows[0] || null;
  },

  /**
   * List all users for admin management (never exposes password_hash)
   */
  async findAll() {
    const query = `
      SELECT id, email, first_name, last_name, role, status, email_verified_at, created_at, updated_at
      FROM users
      ORDER BY id ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  },
};

export default userRepository;
