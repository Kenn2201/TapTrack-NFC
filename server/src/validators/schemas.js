// Zod schemas for request validation
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

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
