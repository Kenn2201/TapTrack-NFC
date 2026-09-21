import { beforeEach, describe, expect, it, vi } from 'vitest';

const repos = vi.hoisted(() => ({
  event: { findAll: vi.fn(), findById: vi.fn(), create: vi.fn(), update: vi.fn() },
  attendance: { findOpenSessionByEvent: vi.fn(), openSession: vi.fn(), findSessionById: vi.fn(), closeSession: vi.fn(), createRecord: vi.fn(), findOpenSessions: vi.fn(), listBySession: vi.fn(), listByUser: vi.fn(), listAll: vi.fn() },
  user: { findById: vi.fn() },
  card: { findById: vi.fn() },
}));
vi.mock('../src/repositories/event.repository.js', () => ({ eventRepository: repos.event }));
vi.mock('../src/repositories/attendance.repository.js', () => ({ attendanceRepository: repos.attendance }));
vi.mock('../src/repositories/user.repository.js', () => ({ userRepository: repos.user }));
vi.mock('../src/repositories/nfcCard.repository.js', () => ({ nfcCardRepository: repos.card }));
vi.mock('../src/services/audit.service.js', () => ({ auditService: { log: vi.fn().mockResolvedValue({}) } }));

const { attendanceService } = await import('../src/services/attendance.service.js');
const { eventService } = await import('../src/services/event.service.js');
const admin = { id: 1, role: 'ADMIN' };
const operator = { id: 2, role: 'OPERATOR' };
const userActor = { id: 3, role: 'USER' };
const event = { id: 10, status: 'OPEN', startAt: '2026-01-01', endAt: '2026-01-02' };
const session = { id: 20, eventId: 10, status: 'OPEN' };
const user = { id: 30, status: 'ACTIVE' };
const card = { id: 40, userId: 30, status: 'ACTIVE' };

describe('v0.6 shared attendance engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repos.event.findById.mockResolvedValue(event);
    repos.attendance.findSessionById.mockResolvedValue(session);
    repos.user.findById.mockResolvedValue(user);
    repos.card.findById.mockResolvedValue(card);
    repos.attendance.createRecord.mockImplementation(async (data) => ({ id: 50, ...data }));
  });

  it('allows ADMIN event creation with a valid window', async () => {
    repos.event.create.mockImplementation(async (x) => x);
    await expect(eventService.createEvent({ name: 'Demo', startAt: '2026-01-01', endAt: '2026-01-02' }, admin)).resolves.toMatchObject({ createdBy: 1 });
  });
  it('denies OPERATOR event creation', async () => expect(eventService.createEvent({ startAt: '2026-01-01', endAt: '2026-01-02' }, operator)).rejects.toMatchObject({ code: 'FORBIDDEN' }));
  it('denies USER attendance operation', async () => expect(attendanceService.recordAttendance({ eventId: 10, sessionId: 20, userId: 30, method: 'MANUAL', actor: userActor })).rejects.toMatchObject({ code: 'FORBIDDEN' }));
  it('opens an attendance session', async () => {
    repos.event.findById.mockResolvedValue({ ...event, status: 'DRAFT' }); repos.attendance.findOpenSessionByEvent.mockResolvedValue(null); repos.attendance.openSession.mockResolvedValue(session);
    await expect(attendanceService.openSession({ eventId: 10, actor: operator })).resolves.toEqual(session);
  });
  it('closes an open attendance session', async () => { repos.attendance.closeSession.mockResolvedValue({ ...session, status: 'CLOSED' }); await expect(attendanceService.closeSession({ sessionId: 20, actor: operator })).resolves.toMatchObject({ status: 'CLOSED' }); });
  it('rejects a closed attendance session', async () => { repos.attendance.findSessionById.mockResolvedValue({ ...session, status: 'CLOSED' }); await expect(attendanceService.recordAttendance({ eventId: 10, sessionId: 20, userId: 30, method: 'MANUAL', actor: operator })).rejects.toMatchObject({ code: 'SESSION_CLOSED' }); });
  for (const method of ['MANUAL', 'NFC_WEB', 'NFC_URL']) {
    it(`records ${method} through the shared engine`, async () => {
      const result = await attendanceService.recordAttendance({ eventId: 10, sessionId: 20, userId: 30, cardId: method === 'MANUAL' ? null : 40, method, actor: operator });
      expect(result.method).toBe(method);
    });
  }
  it('maps the database uniqueness constraint to ALREADY_RECORDED', async () => { repos.attendance.createRecord.mockRejectedValue(Object.assign(new Error(), { code: '23505' })); await expect(attendanceService.recordAttendance({ eventId: 10, sessionId: 20, userId: 30, method: 'MANUAL', actor: operator })).rejects.toMatchObject({ code: 'ALREADY_RECORDED', status: 409 }); });
  it('rejects an inactive user', async () => { repos.user.findById.mockResolvedValue({ ...user, status: 'DISABLED' }); await expect(attendanceService.recordAttendance({ eventId: 10, sessionId: 20, userId: 30, method: 'MANUAL', actor: operator })).rejects.toMatchObject({ code: 'USER_NOT_ACTIVE' }); });
  it('rejects an inactive card', async () => { repos.card.findById.mockResolvedValue({ ...card, status: 'LOST' }); await expect(attendanceService.recordAttendance({ eventId: 10, sessionId: 20, userId: 30, cardId: 40, method: 'NFC_WEB', actor: operator })).rejects.toMatchObject({ code: 'CARD_NOT_ACTIVE' }); });
  it('rejects a card/user mismatch', async () => { repos.card.findById.mockResolvedValue({ ...card, userId: 99 }); await expect(attendanceService.recordAttendance({ eventId: 10, sessionId: 20, userId: 30, cardId: 40, method: 'NFC_URL', actor: operator })).rejects.toMatchObject({ code: 'CARD_USER_MISMATCH' }); });
  it('rejects an invalid event', async () => { repos.event.findById.mockResolvedValue(null); await expect(attendanceService.recordAttendance({ eventId: 99, sessionId: 20, userId: 30, method: 'MANUAL', actor: operator })).rejects.toMatchObject({ code: 'EVENT_NOT_FOUND' }); });
  it('rejects an invalid session', async () => { repos.attendance.findSessionById.mockResolvedValue(null); await expect(attendanceService.recordAttendance({ eventId: 10, sessionId: 99, userId: 30, method: 'MANUAL', actor: operator })).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' }); });
  it('rejects a session/event mismatch', async () => { repos.attendance.findSessionById.mockResolvedValue({ ...session, eventId: 11 }); await expect(attendanceService.recordAttendance({ eventId: 10, sessionId: 20, userId: 30, method: 'MANUAL', actor: operator })).rejects.toMatchObject({ code: 'SESSION_EVENT_MISMATCH' }); });
  it('covers the representative open → NFC → duplicate → close flow', async () => {
    repos.event.findById.mockResolvedValueOnce({ ...event, status: 'DRAFT' });
    repos.attendance.findOpenSessionByEvent.mockResolvedValue(null); repos.attendance.openSession.mockResolvedValue(session);
    await attendanceService.openSession({ eventId: 10, actor: admin });
    await expect(attendanceService.recordAttendance({ eventId: 10, sessionId: 20, userId: 30, cardId: 40, method: 'NFC_WEB', actor: operator })).resolves.toMatchObject({ method: 'NFC_WEB' });
    repos.attendance.createRecord.mockRejectedValueOnce(Object.assign(new Error(), { code: '23505' }));
    await expect(attendanceService.recordAttendance({ eventId: 10, sessionId: 20, userId: 30, cardId: 40, method: 'NFC_WEB', actor: operator })).rejects.toMatchObject({ code: 'ALREADY_RECORDED' });
    repos.attendance.closeSession.mockResolvedValue({ ...session, status: 'CLOSED' });
    await expect(attendanceService.closeSession({ sessionId: 20, actor: admin })).resolves.toMatchObject({ status: 'CLOSED' });
  });
});
