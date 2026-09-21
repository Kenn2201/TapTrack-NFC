// Event controller — event CRUD
export const eventController = {
  getAll: async (req, res, next) => { res.json({ events: [] }); },
  getById: async (req, res, next) => { res.json({ message: 'event stub' }); },
  create: async (req, res, next) => { res.json({ message: 'create stub' }); },
  update: async (req, res, next) => { res.json({ message: 'update stub' }); },
};

