import pool from './db.js';

const mapSession = (row) => row && ({
  id: row.id, eventId: row.event_id, status: row.status, openedAt: row.opened_at,
  closedAt: row.closed_at, openedBy: row.opened_by, closedBy: row.closed_by,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

const mapRecord = (row) => row && ({
  id: row.id, eventId: row.event_id, sessionId: row.session_id, userId: row.user_id,
  cardId: row.card_id, method: row.method, recordedAt: row.recorded_at,
  recordedBy: row.recorded_by, createdAt: row.created_at,
  user: row.first_name ? { firstName: row.first_name, lastName: row.last_name, email: row.email } : undefined,
  event: row.event_name ? { name: row.event_name } : undefined,
});

export const attendanceRepository = {
  async findSessionById(id, client = pool) {
    const result = await client.query('SELECT * FROM attendance_sessions WHERE id = $1 LIMIT 1;', [id]);
    return mapSession(result.rows[0]);
  },
  async findOpenSessionByEvent(eventId) {
    const result = await pool.query("SELECT * FROM attendance_sessions WHERE event_id = $1 AND status = 'OPEN' LIMIT 1;", [eventId]);
    return mapSession(result.rows[0]);
  },
  async findOpenSessions() {
    const result = await pool.query(`
      SELECT s.*, e.name AS event_name, e.start_at, e.end_at
      FROM attendance_sessions s JOIN events e ON e.id = s.event_id
      WHERE s.status = 'OPEN' ORDER BY s.opened_at DESC;
    `);
    return result.rows.map((row) => ({ ...mapSession(row), event: { name: row.event_name, startAt: row.start_at, endAt: row.end_at } }));
  },
  async openSession({ eventId, openedBy }) {
    const result = await pool.query(`
      INSERT INTO attendance_sessions (event_id, opened_by) VALUES ($1, $2) RETURNING *;
    `, [eventId, openedBy]);
    return mapSession(result.rows[0]);
  },
  async closeSession(id, closedBy) {
    const result = await pool.query(`
      UPDATE attendance_sessions SET status = 'CLOSED', closed_at = NOW(), closed_by = $2, updated_at = NOW()
      WHERE id = $1 AND status = 'OPEN' RETURNING *;
    `, [id, closedBy]);
    return mapSession(result.rows[0]);
  },
  async createRecord(data, client = pool) {
    const result = await client.query(`
      INSERT INTO attendance_records (event_id, session_id, user_id, card_id, method, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `, [data.eventId, data.sessionId, data.userId, data.cardId || null, data.method, data.recordedBy]);
    return mapRecord(result.rows[0]);
  },
  async listBySession(sessionId) {
    const result = await pool.query(`
      SELECT ar.*, u.first_name, u.last_name, u.email, e.name AS event_name
      FROM attendance_records ar JOIN users u ON u.id = ar.user_id JOIN events e ON e.id = ar.event_id
      WHERE ar.session_id = $1 ORDER BY ar.recorded_at DESC;
    `, [sessionId]);
    return result.rows.map(mapRecord);
  },
  async listByUser(userId) {
    const result = await pool.query(`
      SELECT ar.*, e.name AS event_name FROM attendance_records ar
      JOIN events e ON e.id = ar.event_id WHERE ar.user_id = $1 ORDER BY ar.recorded_at DESC;
    `, [userId]);
    return result.rows.map(mapRecord);
  },
  async listAll() {
    const result = await pool.query(`
      SELECT ar.*, u.first_name, u.last_name, u.email, e.name AS event_name
      FROM attendance_records ar JOIN users u ON u.id = ar.user_id JOIN events e ON e.id = ar.event_id
      ORDER BY ar.recorded_at DESC LIMIT 500;
    `);
    return result.rows.map(mapRecord);
  },
  async withTransaction(work) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

export default attendanceRepository;
