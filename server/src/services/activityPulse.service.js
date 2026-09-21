import { attendanceRepository } from '../repositories/attendance.repository.js';
const weekStart = (date) => { const d = new Date(date); d.setUTCHours(0, 0, 0, 0); const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() - day + 1); return d; };
export function calculateActivityPulse(records, now = new Date()) {
  const weeks = new Set(records.map((r) => weekStart(r.recordedAt).toISOString()));
  let cursor = weekStart(now); if (!weeks.has(cursor.toISOString())) cursor.setUTCDate(cursor.getUTCDate() - 7);
  let currentStreak = 0; while (weeks.has(cursor.toISOString())) { currentStreak += 1; cursor.setUTCDate(cursor.getUTCDate() - 7); }
  return { totalCheckIns: records.length, eventsAttended: new Set(records.map((r) => r.eventId)).size, attendanceRate: null, attendanceRateLabel: 'N/A', attendanceRateReason: 'Event eligibility is not tracked, so no denominator is fabricated.', currentStreak, streakUnit: 'consecutive calendar weeks with at least one check-in' };
}
export const activityPulseService = { async getForUser(userId) { return calculateActivityPulse(await attendanceRepository.listByUser(userId)); } };
