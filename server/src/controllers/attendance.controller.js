import { attendanceService } from '../services/attendance.service.js';

const id = (value) => Number.parseInt(value, 10);
export const attendanceController = {
  async openSession(req, res, next) { try { res.status(201).json({ session: await attendanceService.openSession({ eventId: id(req.params.id), actor: req.user }) }); } catch (e) { next(e); } },
  async closeSession(req, res, next) { try { res.json({ session: await attendanceService.closeSession({ sessionId: id(req.params.id), actor: req.user }) }); } catch (e) { next(e); } },
  async manual(req, res, next) { try { res.status(201).json({ record: await attendanceService.recordAttendance({ ...req.validated, actor: req.user, method: 'MANUAL' }) }); } catch (e) { next(e); } },
  async getOpenSessions(req, res, next) { try { res.json({ sessions: await attendanceService.listOpenSessions() }); } catch (e) { next(e); } },
  async getSessionRecords(req, res, next) { try { res.json({ records: await attendanceService.listSessionRecords(id(req.params.id)) }); } catch (e) { next(e); } },
  async getAll(req, res, next) { try { res.json({ records: await attendanceService.listAll() }); } catch (e) { next(e); } },
  async getUserHistory(req, res, next) { try { res.json({ records: await attendanceService.listUserHistory(req.user.id) }); } catch (e) { next(e); } },
};
