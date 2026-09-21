// Attendance controller — session management and records
export const attendanceController = {
  openSession: async (req, res, next) => { res.json({ message: 'open stub' }); },
  closeSession: async (req, res, next) => { res.json({ message: 'close stub' }); },
  getAll: async (req, res, next) => { res.json({ attendance: [] }); },
  getUserHistory: async (req, res, next) => { res.json({ attendance: [] }); },
};

