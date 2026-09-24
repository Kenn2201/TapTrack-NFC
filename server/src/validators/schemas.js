import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(100),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(100),
});

export const updateRoleSchema = z.object({
  role: z.enum(['USER', 'OPERATOR'], {
    errorMap: () => ({ message: 'Role can only be USER or OPERATOR' }),
  }),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DISABLED'], {
    errorMap: () => ({ message: 'Status must be ACTIVE or DISABLED' }),
  }),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  nickname: z.string().max(100).optional().nullable(),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthday must be a valid date (YYYY-MM-DD)').optional().nullable(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').max(500).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(100),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long').max(100),
  confirmPassword: z.string().min(8, 'Confirmation must be at least 8 characters long').max(100),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New password and confirmation do not match.',
  path: ['confirmPassword'],
});

// ─── PLATFORM & MAINTENANCE (v1.1.0) ─────────────────────────────────
export const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(1000).optional().nullable(),
  estimatedReturn: z.string().max(120).optional().nullable(),
  releaseLabel: z.string().max(50).optional().nullable(),
});

// ─── FEEDBACK (v1.1.0) ────────────────────────────────────────────────
export const createFeedbackSchema = z.object({
  category: z.enum(['BUG', 'UX', 'FEATURE_REQUEST', 'NFC_ATTENDANCE', 'OTHER']),
  rating: z.number().int().min(1).max(5),
  message: z.string().min(1, 'Feedback message is required').max(2000),
  page: z.string().max(300).optional().nullable(),
  reproduction: z.string().max(2000).optional().nullable(),
});

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(['NEW', 'REVIEWING', 'RESOLVED', 'ARCHIVED']),
});

// ─── EMAIL SUITE (v1.1.0) ────────────────────────────────────────────
const emailBodyShape = {
  subject: z.string().min(1, 'Subject is required').max(200),
  html: z.string().max(10000).optional().nullable(),
  text: z.string().max(10000).optional().nullable(),
  template: z.enum(['VERIFICATION', 'PASSWORD_RESET', 'ROLE_CHANGE', 'STATUS_CHANGE', 'GENERIC']).optional(),
};

const hasEmailBody = (data) => Boolean(data.html?.trim() || data.text?.trim());

export const emailSendSchema = z.object({
  to: z.string().email('A valid recipient email is required'),
  ...emailBodyShape,
}).refine(hasEmailBody, {
  message: 'Provide an HTML or plain-text message body.',
  path: ['html'],
});

export const emailBroadcastSchema = z.object({
  ...emailBodyShape,
  confirmBroadcast: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm the broadcast before sending.' }),
  }),
}).refine(hasEmailBody, {
  message: 'Provide an HTML or plain-text message body.',
  path: ['html'],
});

// ─── EVENT PARTICIPANTS (v1.1.0) ─────────────────────────────────────
export const inviteParticipantsSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1),
});

export const rsvpSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
});

// ─── NFC REISSUE (v1.1.0) ────────────────────────────────────────────
export const reissueCardSchema = z.object({
  confirmInvalidate: z.boolean(),
  reason: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.string().trim()
      .min(3, 'Reason must be at least 3 characters.')
      .max(100, 'Reason cannot exceed 100 characters.')
      .optional()
  ),
});

// ─── NFC CARD PROVISIONING (v0.3.0) ──────────────────────────────────
export const provisionCardSchema = z.object({
  cardLabel: z.string().min(1, 'Card label is required').max(50, 'Card label cannot exceed 50 characters'),
  userId: z.number().int().positive('User ID must be a positive integer').optional(),
});

export const activateCardSchema = z.object({
  confirmWritten: z.boolean().refine((val) => val === true, {
    message: 'You must confirm that the physical card was written and verified with NFC Tools',
  }),
});

export const assignCardSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
});

export const verifyCardTokenSchema = z.object({
  token: z.string({ required_error: 'Card token is required' })
    .min(1, 'Card token is required')
    .max(200, 'Card token cannot exceed 200 characters'),
});

export const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().max(255).optional().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  status: z.enum(['DRAFT', 'OPEN']).optional(),
});

export const updateEventSchema = createEventSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required'
);

export const manualAttendanceSchema = z.object({
  eventId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  userId: z.number().int().positive(),
});

export const nfcAttendanceSchema = z.object({
  token: z.string().min(16).max(200),
  eventId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  method: z.enum(['NFC_WEB', 'NFC_URL']),
});

/** iPhone / Safari URL check-in. Method is never accepted from the client. */
export const nfcUrlAttendanceSchema = z.object({
  token: z.string().min(16).max(200),
  sessionId: z.number().int().positive(),
});

export const cardLifecycleSchema = z.object({
  status: z.enum(['LOST', 'REVOKED', 'DISABLED', 'ACTIVE']),
  reason: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.string().trim()
      .min(3, 'Reason must be at least 3 characters.')
      .max(100, 'Reason cannot exceed 100 characters.')
      .optional()
  ).optional(),
});

export const replaceCardSchema = z.object({
  newCardLabel: z.string().trim().min(1).max(50),
  reason: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.string().trim()
      .min(3, 'Reason must be at least 3 characters.')
      .max(100, 'Reason cannot exceed 100 characters.')
      .optional()
  ),
});
