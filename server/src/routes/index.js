import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { adminUserController } from '../controllers/adminUser.controller.js';
import { cardController } from '../controllers/card.controller.js';
import { eventController } from '../controllers/event.controller.js';
import { nfcController } from '../controllers/nfc.controller.js';
import { attendanceController } from '../controllers/attendance.controller.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { auditController } from '../controllers/audit.controller.js';
import { activityPulseController } from '../controllers/activityPulse.controller.js';
import { platformController } from '../controllers/platform.controller.js';
import { feedbackController } from '../controllers/feedback.controller.js';
import { emailController } from '../controllers/email.controller.js';
import { eventParticipantsController } from '../controllers/eventParticipants.controller.js';
import { cardRequestController } from '../controllers/cardRequest.controller.js';



import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import {
  authLimiter,
  resetLimiter,
  resolveLimiter,
  attendanceLimiter,
  publicFeedbackLimiter,
  authenticatedFeedbackLimiter,
} from '../middleware/rateLimiter.js';
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
changePasswordSchema,
archiveAccountSchema,
provisionCardSchema,
activateCardSchema,
assignCardSchema,
verifyCardTokenSchema,
createEventSchema,
updateEventSchema,
manualAttendanceSchema,
nfcAttendanceSchema,
nfcUrlAttendanceSchema,
cardLifecycleSchema,
replaceCardSchema,
  maintenanceSchema,
createFeedbackSchema,
updateFeedbackStatusSchema,
emailSendSchema,
emailBroadcastSchema,
inviteParticipantsSchema,
reissueCardSchema,
createCardRequestSchema,
updateCardRequestStatusSchema,
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
router.post('/users/me/password', authLimiter, authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/users/me/archive', authenticate, validate(archiveAccountSchema), authController.archiveAccount);
router.get('/users/me/attendance', authenticate, attendanceController.getUserHistory);
router.get('/users/me/activity-pulse', authenticate, activityPulseController.get);
router.get('/users/me/card', authenticate, cardController.getMine);
router.get('/users/me/card-requests', authenticate, cardRequestController.listMine);
router.post('/users/me/card-requests', authenticate, validate(createCardRequestSchema), cardRequestController.createMine);

// ─── ADMIN — USERS & ROLES (v0.2.0) ───────────────────────────────────────────
router.get('/staff/users', authenticate, requireRole('ADMIN', 'OPERATOR'), adminUserController.searchStaffUsers);
router.get('/admin/users', authenticate, requireRole('ADMIN'), adminUserController.getAllUsers);
router.get('/admin/dashboard', authenticate, requireRole('ADMIN'), dashboardController.get);
router.get('/admin/audits', authenticate, requireRole('ADMIN'), auditController.list);
router.get('/admin/users/:id', authenticate, requireRole('ADMIN'), adminUserController.getUserById);
router.patch('/admin/users/:id/role', authenticate, requireRole('ADMIN'), validate(updateRoleSchema), adminUserController.updateUserRole);
router.patch('/admin/users/:id/status', authenticate, requireRole('ADMIN'), validate(updateStatusSchema), adminUserController.updateUserStatus);

// ─── EVENTS ───────────────────────────────────────────────────────────────────
router.get('/events', authenticate, eventController.getAll);
router.get('/events/:id', authenticate, eventController.getById);

// ─── OPERATOR ATTENDANCE ──────────────────────────────────────────────────────
router.get('/sessions/open', authenticate, requireRole('ADMIN', 'OPERATOR'), attendanceController.getOpenSessions);
router.get('/sessions/:id/attendance', authenticate, requireRole('ADMIN', 'OPERATOR'), attendanceController.getSessionRecords);
router.post('/events/:id/sessions', authenticate, requireRole('ADMIN', 'OPERATOR'), attendanceController.openSession);
router.post('/sessions/:id/close', authenticate, requireRole('ADMIN', 'OPERATOR'), attendanceController.closeSession);
router.post('/attendance/manual', attendanceLimiter, authenticate, requireRole('ADMIN', 'OPERATOR'), validate(manualAttendanceSchema), attendanceController.manual);

// ─── NFC WORKFLOWS (v0.4.0 ALPHA & v0.5.0 ALPHA) ───────────────────────────
router.post('/nfc/verify', authenticate, requireRole('ADMIN', 'OPERATOR'), validate(verifyCardTokenSchema), nfcController.verify);
router.post('/nfc/resolve', resolveLimiter, optionalAuthenticate, validate(verifyCardTokenSchema), nfcController.resolve);
router.post('/nfc/check-in', attendanceLimiter, authenticate, requireRole('ADMIN', 'OPERATOR'), validate(nfcAttendanceSchema), nfcController.checkIn);
router.post('/nfc/check-in/url', attendanceLimiter, authenticate, requireRole('ADMIN', 'OPERATOR'), validate(nfcUrlAttendanceSchema), nfcController.checkInUrl);

// ─── ADMIN — NFC CARDS PROVISIONING (v0.3.0) ──────────────────────────────────
router.get('/admin/cards', authenticate, requireRole('ADMIN'), cardController.getAll);
router.get('/admin/cards/:id', authenticate, requireRole('ADMIN'), cardController.getById);
router.post('/admin/cards', authenticate, requireRole('ADMIN'), validate(provisionCardSchema), cardController.provision);
router.post('/admin/cards/provision', authenticate, requireRole('ADMIN'), validate(provisionCardSchema), cardController.provision);
router.patch('/admin/cards/:id/activate', authenticate, requireRole('ADMIN'), validate(activateCardSchema), cardController.activate);
router.patch('/admin/cards/:id/assign', authenticate, requireRole('ADMIN'), validate(assignCardSchema), cardController.assign);
router.post('/admin/cards/:id/assign', authenticate, requireRole('ADMIN'), validate(assignCardSchema), cardController.assign);
router.patch('/admin/cards/:id/lifecycle', authenticate, requireRole('ADMIN'), validate(cardLifecycleSchema), cardController.lifecycle);
router.get('/admin/card-requests', authenticate, requireRole('ADMIN'), cardRequestController.listAdmin);
router.patch('/admin/card-requests/:id/status', authenticate, requireRole('ADMIN'), validate(updateCardRequestStatusSchema), cardRequestController.updateStatus);

// ─── PLATFORM — MAINTENANCE STATUS (public) & CONTROL (v1.1.0) ───────────────
router.get('/platform/maintenance-status', platformController.getStatus);
router.post('/admin/platform/maintenance', authenticate, requireRole('ADMIN'), validate(maintenanceSchema), platformController.setMaintenance);

// ─── FEEDBACK (v1.1.0) ────────────────────────────────────────────────────────
router.post('/feedback/public', publicFeedbackLimiter, validate(createFeedbackSchema), feedbackController.submitPublic);
router.post('/feedback', authenticate, authenticatedFeedbackLimiter, validate(createFeedbackSchema), feedbackController.submit);
router.get('/feedback', authenticate, requireRole('ADMIN'), feedbackController.list);
router.patch('/admin/feedback/:id/status', authenticate, requireRole('ADMIN'), validate(updateFeedbackStatusSchema), feedbackController.updateStatus);

// ─── EMAIL SUITE (v1.1.0) ─────────────────────────────────────────────────────
router.post('/admin/emails/send', authenticate, requireRole('ADMIN'), validate(emailSendSchema), emailController.send);
router.post('/admin/emails/broadcast', authenticate, requireRole('ADMIN'), validate(emailBroadcastSchema), emailController.broadcast);
router.get('/admin/emails/diagnostics', authenticate, requireRole('ADMIN'), emailController.diagnostics);

// ─── EVENT PARTICIPANTS (v1.1.0) ──────────────────────────────────────────────
router.post('/admin/events/:id/participants/invite', authenticate, requireRole('ADMIN'), validate(inviteParticipantsSchema), eventParticipantsController.invite);
router.get('/admin/events/:id/participants', authenticate, requireRole('ADMIN', 'OPERATOR'), eventParticipantsController.list);

// ─── CARD REISSUE (v1.1.0) ────────────────────────────────────────────────────
router.post('/admin/cards/:id/reissue', authenticate, requireRole('ADMIN'), validate(reissueCardSchema), cardController.reissue);

router.post('/admin/cards/:id/replace', authenticate, requireRole('ADMIN'), validate(replaceCardSchema), cardController.replace);

router.post('/admin/events', authenticate, requireRole('ADMIN'), validate(createEventSchema), eventController.create);
router.patch('/admin/events/:id', authenticate, requireRole('ADMIN'), validate(updateEventSchema), eventController.update);
router.get('/admin/attendance', authenticate, requireRole('ADMIN'), attendanceController.getAll);

export default router;
