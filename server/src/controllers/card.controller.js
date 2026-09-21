// Card controller — NFC card CRUD and lifecycle
// Implementation planned for v0.3.0 ALPHA (provisioning), v0.7.0 BETA (full lifecycle)
const notImplemented = (req, res) => res.status(501).json({ error: 'Not implemented' });

export const cardController = {
  getAll: notImplemented,
  create: notImplemented,
  assign: notImplemented,
  revoke: notImplemented,
  replace: notImplemented,
};
