import pool from './db.js';

const mapEvent = (row) => row && ({
  id: row.id,
  name: row.name,
  description: row.description,
  location: row.location,
  startAt: row.start_at,
  endAt: row.end_at,
  status: row.status,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  attendanceCount: row.attendance_count,
  participantCount: row.participant_count,
  hasOpenSession: !!row.has_open_session,
});

export const eventRepository = {
  async findAll() {
    const result = await pool.query(`
      SELECT e.*,
        COUNT(DISTINCT ar.id)::int AS attendance_count,
        COUNT(DISTINCT ep.user_id)::int AS participant_count,
        EXISTS (
          SELECT 1 FROM attendance_sessions s
          WHERE s.event_id = e.id AND s.status = 'OPEN'
        ) AS has_open_session
      FROM events e
      LEFT JOIN attendance_records ar ON ar.event_id = e.id
      LEFT JOIN event_participants ep ON ep.event_id = e.id
      GROUP BY e.id
      ORDER BY e.start_at DESC;
    `);
    return result.rows.map((row) => mapEvent(row));
  },
  async findById(id) {
    const result = await pool.query('SELECT * FROM events WHERE id = $1 LIMIT 1;', [id]);
    return mapEvent(result.rows[0]);
  },
  async create({ name, description, location, startAt, endAt, status, createdBy }) {
    const result = await pool.query(`
      INSERT INTO events (name, description, location, start_at, end_at, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `, [name, description || null, location || null, startAt, endAt, status, createdBy]);
    return mapEvent(result.rows[0]);
  },
  async update(id, fields) {
    const result = await pool.query(`
      UPDATE events SET name = COALESCE($1, name), description = COALESCE($2, description),
        location = COALESCE($3, location), start_at = COALESCE($4, start_at),
        end_at = COALESCE($5, end_at), status = COALESCE($6, status), updated_at = NOW()
      WHERE id = $7 RETURNING *;
    `, [fields.name, fields.description, fields.location, fields.startAt, fields.endAt, fields.status, id]);
    return mapEvent(result.rows[0]);
  },
};

export default eventRepository;