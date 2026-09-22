import jwt from 'jsonwebtoken';
import { config, getJwtSecret } from '../config/index.js';
import { userRepository } from '../repositories/user.repository.js';
import { toSafeUser } from '../services/auth.service.js';

const LAST_SEEN_THROTTLE_MS = 2 * 60 * 1000;

function clearSessionCookie(res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Confirm the JWT is still tied to the user's current session_version.
 * A mismatch means the session was replaced (or revoked) elsewhere.
 */
function isSessionCurrent(decoded, user) {
  return (decoded?.ver ?? 0) === (user.session_version ?? 0);
}

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
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    // Verify user still exists in database and is ACTIVE
    const user = await userRepository.findById(decoded.sub);
    if (!user) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status === 'DISABLED') {
      clearSessionCookie(res);
      return res.status(403).json({ error: 'Your account has been disabled. Access denied.' });
    }

    if (!isSessionCurrent(decoded, user)) {
      clearSessionCookie(res);
      return res.status(401).json({
        code: 'SESSION_REVOKED',
        error: 'You signed in on another device. This TapTrack session has been securely signed out.',
      });
    }

    req.user = toSafeUser(user);

    // Throttled last-seen heartbeat (best effort; never blocks the request).
    try {
      const lastSeen = user.last_seen_at ? new Date(user.last_seen_at).getTime() : 0;
      if (Date.now() - lastSeen > LAST_SEEN_THROTTLE_MS) {
        void userRepository.touchLastSeen(user.id);
      }
    } catch {
      // intentionally ignored — a failed heartbeat must not break requests
    }

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
    if (user && user.status === 'ACTIVE' && isSessionCurrent(decoded, user)) {
      req.user = toSafeUser(user);
    }
    next();
  } catch {
    next();
  }
}

export default authenticate;
