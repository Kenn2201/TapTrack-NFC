import { config } from '../config/index.js';
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
export function requireTrustedOrigin(req, res, next) {
  if (SAFE.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== config.clientUrl) return res.status(403).json({ error: 'Untrusted request origin.', code: 'UNTRUSTED_ORIGIN' });
  return next();
}
