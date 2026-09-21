// Event controller — event CRUD
// Implementation planned for v0.6.0 BETA
const notImplemented = (req, res) => res.status(501).json({ error: 'Not implemented' });

export const eventController = {
  getAll: notImplemented,
  getById: notImplemented,
  create: notImplemented,
  update: notImplemented,
};
