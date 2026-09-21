// Card controller — NFC card CRUD and lifecycle
export const cardController = {
  getAll: async (req, res, next) => { res.json({ cards: [] }); },
  create: async (req, res, next) => { res.json({ message: 'create stub' }); },
  assign: async (req, res, next) => { res.json({ message: 'assign stub' }); },
  revoke: async (req, res, next) => { res.json({ message: 'revoke stub' }); },
  replace: async (req, res, next) => { res.json({ message: 'replace stub' }); },
};

