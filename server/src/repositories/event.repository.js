import pool from './db.js';

const mapEvent = (row) => row && ({
  id: row.id,
  name: row.name,
  description: row.description,
  startAt: row.start_at,
  endAt: row.end_at,
  status: row.status,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const eventRepository = {
  async findAll() {
    const result = await pool.query(`
      SELECT e.*, COUNT(ar.id)::int AS attendance_count
      FROM events e
      LEFT JOIN attendance_records ar ON ar.event_id = e.id
      GROUP BY e.id
      ORDER BY e.start_at DESC;
    `);
    return result.rows.map((row) => ({ ...mapEvent(row), attendanceCount: row.attendance_count }));
  },
  async findById(id) {
    const result = await pool.query('SELECT * FROM events WHERE id = $1 LIMIT 1;', [id]);
    return mapEvent(result.rows[0]);
  },
  async create({ name, description, startAt, endAt, status, createdBy }) {
    const result = await pool.query(`
      INSERT INTO events (name, description, start_at, end_at, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `, [name, description || null, startAt, endAt, status, createdBy]);
    return mapEvent(result.rows[0]);
  },
  async update(id, fields) {
    const result = await pool.query(`
      UPDATE events SET name = COALESCE($1, name), description = COALESCE($2, description),
        start_at = COALESCE($3, start_at), end_at = COALESCE($4, end_at),
        status = COALESCE($5, status), updated_at = NOW()
      WHERE id = $6 RETURNING *;
    `, [fields.name, fields.description, fields.startAt, fields.endAt, fields.status, id]);
    return mapEvent(result.rows[0]);
  },
};

export default eventRepository;
