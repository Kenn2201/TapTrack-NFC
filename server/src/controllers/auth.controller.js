// Auth controller — login, logout, session
// Implementation planned for v0.2.0 ALPHA
const notImplemented = (req, res) => res.status(501).json({ error: 'Not implemented' });

export const authController = {
  login: notImplemented,
  logout: notImplemented,
  me: notImplemented,
};
