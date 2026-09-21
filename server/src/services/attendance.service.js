import { attendanceRepository } from '../repositories/attendance.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { nfcCardRepository } from '../repositories/nfcCard.repository.js';

export const ATTENDANCE_METHODS = Object.freeze(['NFC_WEB', 'NFC_URL', 'MANUAL']);
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

export const attendanceService = {
  async openSession({ eventId, actor }) {
    if (!['ADMIN', 'OPERATOR'].includes(actor?.role)) throw fail(403, 'FORBIDDEN', 'Attendance operation is not permitted.');
    const event = await eventRepository.findById(eventId);
    if (!event) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');
    if (['CLOSED', 'CANCELLED'].includes(event.status)) throw fail(409, 'EVENT_NOT_OPEN', 'This event does not permit attendance.');
    const existing = await attendanceRepository.findOpenSessionByEvent(eventId);
    if (existing) throw fail(409, 'SESSION_ALREADY_OPEN', 'This event already has an open attendance session.');
    try {
      const session = await attendanceRepository.openSession({ eventId, openedBy: actor.id });
      if (event.status !== 'OPEN') await eventRepository.update(eventId, { status: 'OPEN' });
      return session;
    } catch (error) {
      if (error.code === '23505') throw fail(409, 'SESSION_ALREADY_OPEN', 'This event already has an open attendance session.');
      throw error;
    }
  },
  async closeSession({ sessionId, actor }) {
    if (!['ADMIN', 'OPERATOR'].includes(actor?.role)) throw fail(403, 'FORBIDDEN', 'Attendance operation is not permitted.');
    const session = await attendanceRepository.findSessionById(sessionId);
    if (!session) throw fail(404, 'SESSION_NOT_FOUND', 'Attendance session not found.');
    if (session.status !== 'OPEN') throw fail(409, 'SESSION_CLOSED', 'Attendance session is already closed.');
    const closed = await attendanceRepository.closeSession(sessionId, actor.id);
    await eventRepository.update(session.eventId, { status: 'CLOSED' });
    return closed;
  },
  async recordAttendance({ eventId, sessionId, userId, cardId = null, method, actor }) {
    if (!['ADMIN', 'OPERATOR'].includes(actor?.role)) throw fail(403, 'FORBIDDEN', 'Attendance operation is not permitted.');
    if (!ATTENDANCE_METHODS.includes(method)) throw fail(400, 'INVALID_METHOD', 'Attendance method is invalid.');
    const event = await eventRepository.findById(eventId);
    if (!event) throw fail(404, 'EVENT_NOT_FOUND', 'Event not found.');
    if (event.status !== 'OPEN') throw fail(409, 'EVENT_NOT_OPEN', 'Event is not open for attendance.');
    const session = await attendanceRepository.findSessionById(sessionId);
    if (!session) throw fail(404, 'SESSION_NOT_FOUND', 'Attendance session not found.');
    if (session.eventId !== eventId) throw fail(409, 'SESSION_EVENT_MISMATCH', 'Attendance session does not belong to this event.');
    if (session.status !== 'OPEN') throw fail(409, 'SESSION_CLOSED', 'Attendance session is closed.');
    const user = await userRepository.findById(userId);
    if (!user) throw fail(404, 'USER_NOT_FOUND', 'User not found.');
    if (user.status !== 'ACTIVE') throw fail(409, 'USER_NOT_ACTIVE', 'User is not active.');
    if (method !== 'MANUAL') {
      if (!cardId) throw fail(400, 'CARD_REQUIRED', 'An NFC card is required for this method.');
      const card = await nfcCardRepository.findById(cardId);
      if (!card) throw fail(404, 'CARD_NOT_FOUND', 'NFC card not found.');
      if (card.status !== 'ACTIVE') throw fail(409, 'CARD_NOT_ACTIVE', 'NFC card is not active.');
      if (card.userId !== userId) throw fail(409, 'CARD_USER_MISMATCH', 'NFC card is assigned to a different user.');
    }
    try {
      return await attendanceRepository.createRecord({ eventId, sessionId, userId, cardId, method, recordedBy: actor.id });
    } catch (error) {
      if (error.code === '23505') throw fail(409, 'ALREADY_RECORDED', 'Attendance has already been recorded for this user and session.');
      throw error;
    }
  },
  listOpenSessions() { return attendanceRepository.findOpenSessions(); },
  listSessionRecords(sessionId) { return attendanceRepository.listBySession(sessionId); },
  listUserHistory(userId) { return attendanceRepository.listByUser(userId); },
  listAll() { return attendanceRepository.listAll(); },
};

export default attendanceService;
