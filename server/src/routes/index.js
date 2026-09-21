import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { adminUserController } from '../controllers/adminUser.controller.js';
import { cardController } from '../controllers/card.controller.js';
import { eventController } from '../controllers/event.controller.js';
import { nfcController } from '../controllers/nfc.controller.js';
import { attendanceController } from '../controllers/attendance.controller.js';

import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, resetLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateRoleSchema,
  updateStatusSchema,
  updateProfileSchema,
} from '../validators/schemas.js';

const router = Router();

// ─── AUTHENTICATION & SESSION (v0.2.0) ────────────────────────────────────────
router.post('/auth/register', authLimiter, validate(registerSchema), authController.register);
router.post('/auth/login', authLimiter, validate(loginSchema), authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticate, authController.me);

router.post('/auth/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/auth/resend-verification', authLimiter, validate(resendVerificationSchema), authController.resendVerification);
router.post('/auth/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/auth/reset-password', resetLimiter, validate(resetPasswordSchema), authController.resetPassword);

// ─── USER PROFILE (v0.2.0) ───────────────────────────────────────────────────
router.patch('/users/me', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.get('/users/me/attendance', attendanceController.getUserHistory);

// ─── ADMIN — USERS & ROLES (v0.2.0) ───────────────────────────────────────────
router.get('/admin/users', authenticate, requireRole('ADMIN'), adminUserController.getAllUsers);
router.get('/admin/users/:id', authenticate, requireRole('ADMIN'), adminUserController.getUserById);
router.patch('/admin/users/:id/role', authenticate, requireRole('ADMIN'), validate(updateRoleSchema), adminUserController.updateUserRole);
router.patch('/admin/users/:id/status', authenticate, requireRole('ADMIN'), validate(updateStatusSchema), adminUserController.updateUserStatus);

// ─── EVENTS (Planned v0.6.0) ──────────────────────────────────────────────────
router.get('/events', eventController.getAll);
router.get('/events/:id', eventController.getById);

// ─── OPERATOR ATTENDANCE (Planned v0.6.0) ─────────────────────────────────────
router.post('/events/:id/sessions', attendanceController.openSession);
router.post('/sessions/:id/close', attendanceController.closeSession);

// ─── NFC WORKFLOWS (Planned v0.3.0 - v0.5.0) ──────────────────────────────────
router.post('/nfc/resolve', nfcController.resolve);
router.post('/nfc/check-in', nfcController.checkIn);
router.post('/nfc/verify', nfcController.verify);

// ─── ADMIN — CARDS & EVENTS (Planned v0.3.0 / v0.6.0 / v0.7.0) ───────────────
router.get('/admin/cards', cardController.getAll);
router.post('/admin/cards', cardController.create);
router.post('/admin/cards/:id/assign', cardController.assign);
router.post('/admin/cards/:id/revoke', cardController.revoke);
router.post('/admin/cards/:id/replace', cardController.replace);

router.post('/admin/events', eventController.create);
router.patch('/admin/events/:id', eventController.update);
router.get('/admin/attendance', attendanceController.getAll);

export default router;
