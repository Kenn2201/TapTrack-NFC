import jwt from 'jsonwebtoken';
import { config, getJwtSecret } from '../config/index.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { userRepository } from '../repositories/user.repository.js';

const EXEMPT_PATHS = new Set([
  '/auth/login',
  '/auth/logout',
  '/platform/maintenance-status',
]);

/**
 * Server-enforced maintenance mode.
 * When enabled: unauthenticated and non-admin traffic receives a 503
 * MAINTENANCE_MODE response. Authenticated administrators bypass.
 */
export async function maintenanceMiddleware(req, res, next) {
  try {
    if (EXEMPT_PATHS.has(req.path)) return next();

    const settings = await settingsRepository.get();
    if (!settings.maintenanceEnabled) return next();

    // Lightweight role detection so admins can reach authenticated routes.
    let isAdmin = false;
    const token = req.cookies?.[config.cookieName];
    if (token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret());
        const user = await userRepository.findById(decoded.sub);
        isAdmin = Boolean(user && user.status === 'ACTIVE' && user.role === 'ADMIN' && (decoded.ver ?? 0) === (user.session_version ?? 0));
      } catch {
        isAdmin = false;
      }
    }

    if (isAdmin) return next();

    return res.status(503).json({
      error: 'Scheduled Maintenance Mode',
      code: 'MAINTENANCE_MODE',
      maintenance: {
        message: settings.maintenanceMessage,
        estimatedReturn: settings.estimatedReturn,
        releaseLabel: settings.releaseLabel,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export default maintenanceMiddleware;