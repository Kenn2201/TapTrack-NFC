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
});

// ─── NFC CARD PROVISIONING (v0.3.0) ──────────────────────────────────────────
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

export const cardLifecycleSchema = z.object({
  status: z.enum(['LOST', 'REVOKED', 'DISABLED', 'ACTIVE']),
  reason: z.string().trim().min(3).max(200).optional(),
});

export const replaceCardSchema = z.object({
  newCardLabel: z.string().trim().min(1).max(50),
  reason: z.string().trim().min(3).max(200).optional(),
});
