// Attendance controller — session management and records
// Implementation planned for v0.6.0 BETA
const notImplemented = (req, res) => res.status(501).json({ error: 'Not implemented' });

export const attendanceController = {
  openSession: notImplemented,
  closeSession: notImplemented,
  getAll: notImplemented,
  getUserHistory: notImplemented,
};
