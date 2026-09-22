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

  async rsvp(eventId, userId, status) {
    const result = await pool.query(`
      UPDATE event_participants SET status = $3, updated_at = NOW()
      WHERE event_id = $1 AND user_id = $2
      RETURNING *;
    `, [eventId, userId, status]);
    return mapParticipant(result.rows[0]);
  },
};

export default eventParticipantsRepository;
