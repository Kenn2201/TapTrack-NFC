/**
 * Role-based access control middleware
 * Usage: requireRole('ADMIN'), requireRole('ADMIN', 'OPERATOR')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to perform this action.' });
    }

    next();
  };
}

export default requireRole;
