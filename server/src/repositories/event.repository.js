import pool from './db.js';

let visibilitySupportCache = null;

const mapEvent = (row) => row && ({
  id: row.id,
  name: row.name,
  description: row.description,
  location: row.location,
  visibility: row.visibility || 'PUBLIC',
  startAt: row.start_at,
  endAt: row.end_at,
  status: row.status,
  createdBy: row.created_by,
  creator: row.creator_id ? {
    id: row.creator_id,
    email: row.creator_email,
    firstName: row.creator_first_name,
    lastName: row.creator_last_name,
  } : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  attendanceCount: row.attendance_count,
  participantCount: row.participant_count,
  hasOpenSession: !!row.has_open_session,
  attendanceSession: row.session_id ? {
    id: row.session_id,
    status: row.session_status,
    openedAt: row.session_opened_at,
    closedAt: row.session_closed_at,
    checkInCount: Number(row.session_check_in_count || 0),
  } : null,
});

async function supportsVisibility(client = pool) {
  // Cache only a confirmed supported schema. A false result is rechecked so
  // migration 008 can be applied after deployment without requiring a restart.
  if (visibilitySupportCache === true && client === pool) return true;
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'events'
        AND column_name = 'visibility'
    ) AS supported;
  `);
  const supported = Boolean(result.rows[0]?.supported);
  if (client === pool && supported) visibilitySupportCache = true;
  return supported;
}

export const eventRepository = {
  supportsVisibility,

  async findAll() {
    const result = await pool.query(`
      SELECT e.*,
        creator.id AS creator_id,
        creator.email AS creator_email,
        creator.first_name AS creator_first_name,
        creator.last_name AS creator_last_name,
        COUNT(DISTINCT ar.id)::int AS attendance_count,
        COUNT(DISTINCT ep.user_id)::int AS participant_count,
        EXISTS (
          SELECT 1 FROM attendance_sessions s
          WHERE s.event_id = e.id AND s.status = 'OPEN'
        ) AS has_open_session
      FROM events e
      LEFT JOIN users creator ON creator.id = e.created_by
      LEFT JOIN attendance_records ar ON ar.event_id = e.id
      LEFT JOIN event_participants ep ON ep.event_id = e.id
      GROUP BY e.id, creator.id
      ORDER BY e.start_at DESC;
    `);
    return result.rows.map((row) => mapEvent(row));
  },

  async findById(id) {
    const result = await pool.query(`
      SELECT e.*,
        creator.id AS creator_id,
        creator.email AS creator_email,
        creator.first_name AS creator_first_name,
        creator.last_name AS creator_last_name,
        session_info.session_id,
        session_info.session_status,
        session_info.session_opened_at,
        session_info.session_closed_at,
        session_info.session_check_in_count,
        (
          SELECT COUNT(*)::int FROM attendance_records ar
          WHERE ar.event_id = e.id
        ) AS attendance_count,
        (
          SELECT COUNT(*)::int FROM event_participants ep
          WHERE ep.event_id = e.id
        ) AS participant_count,
        EXISTS (
          SELECT 1 FROM attendance_sessions s
          WHERE s.event_id = e.id AND s.status = 'OPEN'
        ) AS has_open_session
      FROM events e
      LEFT JOIN users creator ON creator.id = e.created_by
      LEFT JOIN LATERAL (
        SELECT
          s.id AS session_id,
          s.status AS session_status,
          s.opened_at AS session_opened_at,
          s.closed_at AS session_closed_at,
          (
            SELECT COUNT(*)::int
            FROM attendance_records session_ar
            WHERE session_ar.session_id = s.id
          ) AS session_check_in_count
        FROM attendance_sessions s
        WHERE s.event_id = e.id
        ORDER BY (s.status = 'OPEN') DESC, s.opened_at DESC
        LIMIT 1
      ) session_info ON TRUE
      WHERE e.id = $1
      LIMIT 1;
    `, [id]);
    return mapEvent(result.rows[0]);
  },

  async create({ name, description, location, visibility = 'PUBLIC', startAt, endAt, status, createdBy }) {
    if (visibility === 'INVITE_ONLY' && !(await supportsVisibility())) {
      const error = new Error('Invite-only events require database migration 008 before they can be created.');
      error.status = 503;
      error.code = 'EVENT_VISIBILITY_SCHEMA_REQUIRED';
      error.expose = true;
      throw error;
    }

    const visibilitySupported = await supportsVisibility();
    const result = visibilitySupported
      ? await pool.query(`
          INSERT INTO events (name, description, location, visibility, start_at, end_at, status, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;
        `, [name, description || null, location || null, visibility, startAt, endAt, status, createdBy])
      : await pool.query(`
          INSERT INTO events (name, description, location, start_at, end_at, status, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
        `, [name, description || null, location || null, startAt, endAt, status, createdBy]);

    return result.rows[0] ? this.findById(result.rows[0].id) : null;
  },

  async update(id, fields) {
    const visibilitySupported = await supportsVisibility();
    if (fields.visibility === 'INVITE_ONLY' && !visibilitySupported) {
      const error = new Error('Invite-only events require database migration 008 before they can be enabled.');
      error.status = 503;
      error.code = 'EVENT_VISIBILITY_SCHEMA_REQUIRED';
      error.expose = true;
      throw error;
    }

    const result = visibilitySupported
      ? await pool.query(`
          UPDATE events SET name = COALESCE($1, name), description = COALESCE($2, description),
            location = COALESCE($3, location), start_at = COALESCE($4, start_at),
            end_at = COALESCE($5, end_at), status = COALESCE($6, status),
            visibility = COALESCE($7, visibility), updated_at = NOW()
          WHERE id = $8 RETURNING id;
        `, [fields.name, fields.description, fields.location, fields.startAt, fields.endAt, fields.status, fields.visibility, id])
      : await pool.query(`
          UPDATE events SET name = COALESCE($1, name), description = COALESCE($2, description),
            location = COALESCE($3, location), start_at = COALESCE($4, start_at),
            end_at = COALESCE($5, end_at), status = COALESCE($6, status), updated_at = NOW()
          WHERE id = $7 RETURNING id;
        `, [fields.name, fields.description, fields.location, fields.startAt, fields.endAt, fields.status, id]);

    return result.rows[0] ? this.findById(result.rows[0].id) : null;
  },
};

export default eventRepository;
