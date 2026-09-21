// NFC controller — credential resolution and verification
// All handlers converge on the shared attendance service
export const nfcController = {
  resolve: async (req, res, next) => { res.json({ message: 'resolve stub' }); },
  checkIn: async (req, res, next) => { res.json({ message: 'checkin stub' }); },
  verify: async (req, res, next) => { res.json({ message: 'verify stub' }); },
};

