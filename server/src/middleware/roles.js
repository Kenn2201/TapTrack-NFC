// Role-based access control middleware
export function requireRole(...roles) {
  return (req, res, next) => {
    // Will be implemented in v0.2.0
    next();
  };
}
