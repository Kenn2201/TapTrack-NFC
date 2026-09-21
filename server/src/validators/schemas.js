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

// Placeholders for future phases
export const createCardSchema = z.object({
  cardLabel: z.string().min(1).max(50),
  userId: z.number().int().optional(),
});

export const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});
