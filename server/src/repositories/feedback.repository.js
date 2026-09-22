import pool from './db.js';

const mapFeedback = (row) => row && ({
  id: row.id,
  userId: row.user_id,
  category: row.category,
  rating: row.rating,
  message: row.message,
  page: row.page,
  reproduction: row.reproduction,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  // populated via joins when present
  userEmail: row.user_email || null,
  userFirstName: row.user_first_name || null,
  userLastName: row.user_last_name || null,
});

export const feedbackRepository = {
  async create({ userId, category, rating, message, page, reproduction }) {
    const result = await pool.query(`
      INSERT INTO feedback (user_id, category, rating, message, page, reproduction, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'NEW', NOW(), NOW())
      RETURNING *;
    `, [userId, category, rating, message, page || null, reproduction || null]);
    return mapFeedback(result.rows[0]);
  },

  async list({ status = null } = {}) {
    let query = `
      SELECT f.*, u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      params.push(status);
      query += ` AND f.status = $${params.length}`;
    }
    query += ` ORDER BY f.created_at DESC;`;
    const result = await pool.query(query, params);
    return result.rows.map(mapFeedback);
  },

  async updateStatus(id, status) {
    const result = await pool.query(`
      UPDATE feedback SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `, [status, id]);
    return mapFeedback(result.rows[0]);
  },
};

export default feedbackRepository;