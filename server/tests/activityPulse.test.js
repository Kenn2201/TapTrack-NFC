import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/repositories/attendance.repository.js', () => ({
  attendanceRepository: { listByUser: vi.fn() },
}));
vi.mock('../src/repositories/eventParticipants.repository.js', () => ({
  eventParticipantsRepository: { getRequiredAttendanceStats: vi.fn() },
}));

const { calculateActivityPulse } = await import('../src/services/activityPulse.service.js');

describe('v1.2 attendance rate rules', () => {
  const records = [
    { eventId: 1, recordedAt: '2026-09-01T10:00:00.000Z' },
    { eventId: 1, recordedAt: '2026-09-01T10:05:00.000Z' },
    { eventId: 2, recordedAt: '2026-09-08T10:00:00.000Z' },
  ];

  it('uses only closed invite-only required events for Attendance Rate', () => {
    const result = calculateActivityPulse(
      records,
      { eligibleEvents: 4, attendedEvents: 3 },
      new Date('2026-09-09T00:00:00.000Z')
    );

    expect(result.totalCheckIns).toBe(3);
    expect(result.eventsAttended).toBe(2);
    expect(result.attendanceRate).toBe(75);
    expect(result.requiredEvents).toBe(4);
    expect(result.requiredEventsAttended).toBe(3);
    expect(result.attendanceRateReason).toMatch(/Public events do not count against this rate/);
  });

  it('shows No required events yet instead of Pending/N-A when denominator is zero', () => {
    const result = calculateActivityPulse(records, { eligibleEvents: 0, attendedEvents: 0 });
    expect(result.attendanceRate).toBeNull();
    expect(result.attendanceRateLabel).toBe('No required events yet');
    expect(result.attendanceRateReason).toMatch(/Public events do not count as missed attendance/);
  });
});
