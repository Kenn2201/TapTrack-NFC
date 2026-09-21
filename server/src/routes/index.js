import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { cardController } from '../controllers/card.controller.js';
import { eventController } from '../controllers/event.controller.js';
import { nfcController } from '../controllers/nfc.controller.js';
import { attendanceController } from '../controllers/attendance.controller.js';

const router = Router();

// Auth
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authController.me);

// User
router.get('/users/me/attendance', attendanceController.getUserHistory);

// Events
router.get('/events', eventController.getAll);
router.get('/events/:id', eventController.getById);

// Operator
router.post('/events/:id/sessions', attendanceController.openSession);
router.post('/sessions/:id/close', attendanceController.closeSession);

// NFC
router.post('/nfc/resolve', nfcController.resolve);
router.post('/nfc/check-in', nfcController.checkIn);
router.post('/nfc/verify', nfcController.verify);

// Admin — Cards
router.get('/admin/cards', cardController.getAll);
router.post('/admin/cards', cardController.create);
router.post('/admin/cards/:id/assign', cardController.assign);
router.post('/admin/cards/:id/revoke', cardController.revoke);
router.post('/admin/cards/:id/replace', cardController.replace);

// Admin — Events
router.post('/admin/events', eventController.create);
router.patch('/admin/events/:id', eventController.update);

// Admin — Attendance & Audit
router.get('/admin/attendance', attendanceController.getAll);

export default router;
