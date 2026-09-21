// Auth controller — login, logout, session
export const authController = {
  login: async (req, res, next) => { res.json({ message: 'login stub' }); },
  logout: async (req, res, next) => { res.json({ message: 'logout stub' }); },
  me: async (req, res, next) => { res.json({ message: 'me stub' }); },
};

