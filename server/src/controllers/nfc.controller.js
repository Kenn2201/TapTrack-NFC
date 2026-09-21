import { nfcCardService } from '../services/nfcCard.service.js';
import { attendanceService } from '../services/attendance.service.js';

// NFC controller — credential resolution and verification
// All handlers converge on the shared attendance service
export const nfcController = {
  async checkIn(req, res, next) {
    try {
      const { token, eventId, sessionId, method } = req.validated;
      const card = await nfcCardService._lookupAndValidateCard(token);
      const record = await attendanceService.recordAttendance({
        eventId, sessionId, method, userId: card.userId, cardId: card.id, actor: req.user,
      });
      return res.status(201).json({ record, card: { cardLabel: card.cardLabel } });
    } catch (err) {
      return next(err);
    }
  },

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
