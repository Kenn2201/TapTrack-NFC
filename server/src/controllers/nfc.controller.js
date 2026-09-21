import { nfcCardService } from '../services/nfcCard.service.js';

// NFC controller — credential resolution and verification
// All handlers converge on the shared attendance service
const notImplemented = (req, res) => res.status(501).json({ error: 'Not implemented' });

export const nfcController = {
  checkIn: notImplemented, // Planned v0.6.0

  /**
   * POST /api/nfc/resolve
   * Resolve an NFC card credential for public universal /t#token fallback (v0.5.0 ALPHA)
   * Strictly receives token in HTTPS POST body.
   * Minimal privacy-preserving payload for public users; full payload for operators/admins.
   */
  async resolve(req, res, next) {
    try {
      const { token } = req.body;
      const isOperatorOrAdmin = req.user && ['ADMIN', 'OPERATOR'].includes(req.user.role);
      const result = await nfcCardService.resolveCardToken(token, { isOperatorOrAdmin });
      return res.json(result);
    } catch (err) {
      if (err.code && err.status) {
        return res.status(err.status).json({
          valid: false,
          code: err.code,
          error: err.message,
        });
      }
      return next(err);
    }
  },

  /**
   * POST /api/nfc/verify
   * Verify an NFC card credential for authorized operators/admins (v0.4.0 ALPHA)
   * Strictly receives token in HTTPS POST body.
   */
  async verify(req, res, next) {
    try {
      const { token } = req.body;
      const result = await nfcCardService.verifyCardToken(token);
      return res.json(result);
    } catch (err) {
      if (err.code && err.status) {
        return res.status(err.status).json({
          valid: false,
          code: err.code,
          error: err.message,
        });
      }
      return next(err);
    }
  },
};
