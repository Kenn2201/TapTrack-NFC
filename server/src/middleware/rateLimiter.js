import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

/**
 * Standard rate limiter response
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    error: 'Too many requests. Please slow down and try again later.',
  });
};

/**
 * Auth rate limiter for login, register, forgot-password, resend-verification
 * 15-minute window, maximum 30 attempts per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'test' ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  // Express 'trust proxy' 1 is configured in app.js for Render's reverse proxy
  validate: { trustProxy: true },
});

/**
 * Stricter limiter for password reset actions
 */
export const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'test' ? 50 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  validate: { trustProxy: true },
});

export default {
  authLimiter,
  resetLimiter,
};
