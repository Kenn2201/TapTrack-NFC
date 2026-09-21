// NFC controller — credential resolution and verification
// All handlers converge on the shared attendance service
// Implementation planned for v0.4.0 ALPHA (Web NFC), v0.5.0 ALPHA (URL NFC)
const notImplemented = (req, res) => res.status(501).json({ error: 'Not implemented' });

export const nfcController = {
  resolve: notImplemented,
  checkIn: notImplemented,
  verify: notImplemented,
};
