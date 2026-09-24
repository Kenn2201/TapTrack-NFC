import { attendanceRepository } from '../repositories/attendance.repository.js';
import { eventParticipantsRepository } from '../repositories/eventParticipants.repository.js';

const weekStart = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d;
};

export function calculateActivityPulse(records, requiredStats = { eligibleEvents: 0, attendedEvents: 0 }, now = new Date()) {
  const weeks = new Set(records.map((r) => weekStart(r.recordedAt).toISOString()));
  let cursor = weekStart(now);
  if (!weeks.has(cursor.toISOString())) cursor.setUTCDate(cursor.getUTCDate() - 7);

  let currentStreak = 0;
  while (weeks.has(cursor.toISOString())) {
    currentStreak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }

  const eligibleEvents = Number(requiredStats?.eligibleEvents || 0);
  const attendedRequiredEvents = Number(requiredStats?.attendedEvents || 0);
  const attendanceRate = eligibleEvents > 0
    ? Math.round((attendedRequiredEvents / eligibleEvents) * 100)
    : null;

  return {
    totalCheckIns: records.length,
    eventsAttended: new Set(records.map((r) => r.eventId)).size,
    attendanceRate,
    attendanceRateLabel: eligibleEvents > 0 ? `${attendanceRate}%` : 'No required events yet',
    attendanceRateReason: eligibleEvents > 0
      ? `${attendedRequiredEvents} of ${eligibleEvents} closed invite-only events attended. Public events do not count against this rate.`
      : 'Attendance rate starts after you have at least one closed invite-only event where you were invited. Public events do not count as missed attendance.',
    requiredEvents: eligibleEvents,
    requiredEventsAttended: attendedRequiredEvents,
    currentStreak,
    streakUnit: 'consecutive calendar weeks with at least one check-in',
  };
}

export const activityPulseService = {
  async getForUser(userId) {
    const [records, requiredStats] = await Promise.all([
      attendanceRepository.listByUser(userId),
      eventParticipantsRepository.getRequiredAttendanceStats(userId),
    ]);
    return calculateActivityPulse(records, requiredStats);
  },
};
