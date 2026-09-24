import pool from './db.js';

const mapRow = (row) => row && ({
  id: row.id,
  userId: row.user_id,
  cardId: row.card_id,
  requestType: row.request_type,
  status: row.status,
  note: row.note,
  adminNote: row.admin_note,
  handledBy: row.handled_by,
  handledAt: row.handled_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  user: row.user_email ? {
    id: row.user_id,
    email: row.user_email,
    firstName: row.user_first_name,
    lastName: row.user_last_name,
  } : null,
  card: row.card_label ? {
    id: row.card_id,
    cardLabel: row.card_label,
    status: row.card_status,
  } : null,
});

const selectBase = `
  SELECT cr.*,
    u.email AS user_email,
    u.first_name AS user_first_name,
    u.last_name AS user_last_name,
    c.card_label,
    c.status AS card_status
  FROM card_requests cr
  JOIN users u ON u.id = cr.user_id
  LEFT JOIN nfc_cards c ON c.id = cr.card_id
`;

export const cardRequestRepository = {
  async create({ userId, cardId = null, requestType, note = null }) {
    const result = await pool.query(`
      INSERT INTO card_requests (user_id, card_id, request_type, note)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `, [userId, cardId, requestType, note]);
    return this.findById(result.rows[0].id);
  },

  async findById(id) {
    const result = await pool.query(`${selectBase} WHERE cr.id = $1 LIMIT 1;`, [id]);
    return mapRow(result.rows[0]);
  },

  async findOpenByUserId(userId) {
    const result = await pool.query(`
      ${selectBase}
      WHERE cr.user_id = $1 AND cr.status IN ('PENDING', 'IN_REVIEW')
      ORDER BY cr.created_at DESC LIMIT 1;
    `, [userId]);
    return mapRow(result.rows[0]);
  },

  async listByUser(userId) {
    const result = await pool.query(`
      ${selectBase}
      WHERE cr.user_id = $1
      ORDER BY cr.created_at DESC;
    `, [userId]);
    return result.rows.map(mapRow);
  },

  async listAll({ status = null } = {}) {
    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = `WHERE cr.status = $${params.length}`;
    }
    const result = await pool.query(`
      ${selectBase}
      ${where}
      ORDER BY
        CASE cr.status WHEN 'PENDING' THEN 0 WHEN 'IN_REVIEW' THEN 1 ELSE 2 END,
        cr.created_at DESC;
    `, params);
    return result.rows.map(mapRow);
  },

  async updateStatus(id, { status, adminNote = null, actorId }) {
    const result = await pool.query(`
      UPDATE card_requests
      SET status = $1,
          admin_note = $2,
          handled_by = $3,
          handled_at = CASE WHEN $1 IN ('FULFILLED', 'REJECTED') THEN NOW() ELSE handled_at END,
          updated_at = NOW()
      WHERE id = $4
      RETURNING id;
    `, [status, adminNote, actorId, id]);
    return result.rows[0] ? this.findById(result.rows[0].id) : null;
  },
};

export default cardRequestRepository;
