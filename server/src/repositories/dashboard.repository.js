import pool from './db.js';

export const dashboardRepository = {
  async getMetrics() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE status = 'ACTIVE') AS active_users,
        (SELECT COUNT(*)::int FROM nfc_cards WHERE status = 'ACTIVE') AS active_cards,
        (SELECT COUNT(*)::int FROM nfc_cards WHERE user_id IS NULL) AS unassigned_cards,
        (SELECT COUNT(*)::int FROM nfc_cards WHERE status = 'LOST') AS lost_cards,
        (SELECT COUNT(*)::int FROM nfc_cards WHERE status = 'REVOKED') AS revoked_cards,
        (SELECT COUNT(*)::int FROM nfc_cards WHERE status = 'DISABLED') AS disabled_cards,
        (SELECT COUNT(*)::int FROM events WHERE status = 'OPEN') AS active_events,
        (SELECT COUNT(*)::int FROM attendance_sessions WHERE status = 'OPEN') AS open_sessions,
        (SELECT COUNT(*)::int FROM attendance_records WHERE recorded_at >= CURRENT_DATE) AS attendance_today;
    `);
    const row = result.rows[0];
    return {
      totalUsers: row.total_users, activeUsers: row.active_users, activeCards: row.active_cards,
      unassignedCards: row.unassigned_cards, lostCards: row.lost_cards, revokedCards: row.revoked_cards,
      disabledCards: row.disabled_cards, activeEvents: row.active_events,
      openSessions: row.open_sessions, attendanceToday: row.attendance_today,
    };
  },
};
