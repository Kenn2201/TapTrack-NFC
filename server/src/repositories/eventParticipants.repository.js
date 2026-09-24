import pool from './db.js';
import { eventRepository } from './event.repository.js';

const mapParticipant = (row) => row && ({
  id: row.id,
  eventId: row.event_id,
  userId: row.user_id,
  status: row.status,
  invitedBy: row.invited_by,
  invitedAt: row.invited_at,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
});

export const eventParticipantsRepository = {
  async findByEvent(eventId) {
    const result = await pool.query(`
      SELECT ep.*, u.email, u.first_name, u.last_name
      FROM event_participants ep
      JOIN users u ON u.id = ep.user_id
      WHERE ep.event_id = $1
      ORDER BY ep.invited_at ASC;
    `, [eventId]);
    return result.rows.map(mapParticipant);
  },

  async findByEventAndUser(eventId, userId) {
    const result = await pool.query(`
      SELECT ep.*, u.email, u.first_name, u.last_name
      FROM event_participants ep
      JOIN users u ON u.id = ep.user_id
      WHERE ep.event_id = $1 AND ep.user_id = $2 LIMIT 1;
    `, [eventId, userId]);
    return mapParticipant(result.rows[0]);
  },

  async isInvited(eventId, userId) {
    const result = await pool.query(
      'SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2 LIMIT 1;',
      [eventId, userId]
    );
    return result.rowCount > 0;
  },

  async invite({ eventId, userIds, invitedBy }) {
    const values = [];
    const params = [];
    let query = `
      INSERT INTO event_participants (event_id, user_id, status, invited_by, invited_at)
      VALUES `;
    userIds.forEach((userId, i) => {
      params.push(eventId, userId, invitedBy);
      values.push(`($${i * 3 + 1}, $${i * 3 + 2}, 'INVITED', $${i * 3 + 3}, NOW())`);
    });
    query += values.join(', ');
    query += `
      ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'INVITED', invited_by = EXCLUDED.invited_by, invited_at = NOW()
      RETURNING *;
    `;
    const result = await pool.query(query, params);
    return result.rows.map(mapParticipant);
  },

  async getRequiredAttendanceStats(userId) {
    if (!(await eventRepository.supportsVisibility())) {
      return { eligibleEvents: 0, attendedEvents: 0 };
    }

    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT ep.event_id)::int AS eligible_events,
        COUNT(DISTINCT CASE WHEN ar.id IS NOT NULL THEN ep.event_id END)::int AS attended_events
      FROM event_participants ep
      JOIN events e ON e.id = ep.event_id
      LEFT JOIN attendance_records ar
        ON ar.event_id = ep.event_id
       AND ar.user_id = ep.user_id
      WHERE ep.user_id = $1
        AND e.visibility = 'INVITE_ONLY'
        AND e.status = 'CLOSED';
    `, [userId]);

    return {
      eligibleEvents: Number(result.rows[0]?.eligible_events || 0),
      attendedEvents: Number(result.rows[0]?.attended_events || 0),
    };
  },
};

export default eventParticipantsRepository;
