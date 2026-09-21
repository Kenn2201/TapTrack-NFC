import jwt from 'jsonwebtoken';
import { config, getJwtSecret } from '../config/index.js';
import { userRepository } from '../repositories/user.repository.js';
import { toSafeUser } from '../services/auth.service.js';

/**
 * Authentication middleware
 * Verifies HttpOnly cookie `taptrack_session` (or Bearer header if testing)
 * and confirms account is still ACTIVE in the database.
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[config.cookieName];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const secret = getJwtSecret();
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      res.clearCookie(config.cookieName, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    // Verify user still exists in database and is ACTIVE
    const user = await userRepository.findById(decoded.sub);
    if (!user) {
      res.clearCookie(config.cookieName, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status === 'DISABLED') {
      res.clearCookie(config.cookieName, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return res.status(403).json({ error: 'Your account has been disabled. Access denied.' });
    }

    req.user = toSafeUser(user);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication middleware
 * If a valid session cookie exists, attaches req.user.
 * If not present or invalid, silently proceeds without error (req.user remains undefined).
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    const token = req.cookies?.[config.cookieName];
    if (!token) {
      return next();
    }

    const secret = getJwtSecret();
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return next();
    }

    const user = await userRepository.findById(decoded.sub);
    if (user && user.status === 'ACTIVE') {
      req.user = toSafeUser(user);
    }
    next();
  } catch {
    next();
  }
}

export default authenticate;
