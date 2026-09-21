import { nfcCardService } from '../services/nfcCard.service.js';
import { cardLifecycleService } from '../services/cardLifecycle.service.js';

export const cardController = {
  async getMine(req, res, next) {
    try { return res.json({ card: await nfcCardService.getUserCard(req.user.id) }); }
    catch (error) { return next(error); }
  },
  /**
   * GET /api/admin/cards
   * List all NFC cards (safe metadata only; token_hash is strictly stripped)
   */
  async getAll(req, res, next) {
    try {
      const { status, search } = req.query;
      const cards = await nfcCardService.listCards({ status, search });
      return res.json({ cards });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/admin/cards/:id
   * Get single card metadata (safe metadata only; token_hash is strictly stripped)
   */
  async getById(req, res, next) {
    try {
      const cardId = parseInt(req.params.id, 10);
      if (isNaN(cardId)) {
        return res.status(400).json({ error: 'Invalid card ID' });
      }
      const card = await nfcCardService.getCardById(cardId);
      return res.json({ card });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/admin/cards/provision (or POST /api/admin/cards)
   * Provision a physical card, generate opaque token, derive hash, and return write URL
   */
  async provision(req, res, next) {
    try {
      const { cardLabel, userId } = req.body;
      const actorId = req.user?.id;

      const result = await nfcCardService.provisionCard({
        cardLabel,
        userId: userId ? parseInt(userId, 10) : undefined,
        actorId,
      });

      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PATCH /api/admin/cards/:id/activate
   * Confirm physical write and transition card status to ACTIVE
   */
  async activate(req, res, next) {
    try {
      const cardId = parseInt(req.params.id, 10);
      if (isNaN(cardId)) {
        return res.status(400).json({ error: 'Invalid card ID' });
      }

      const { confirmWritten } = req.body;
      const actorId = req.user?.id;

      const card = await nfcCardService.activateCard(cardId, {
        actorId,
        confirmWritten,
      });

      return res.json({ card });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PATCH /api/admin/cards/:id/assign
   * Assign or reassign card to a user
   */
  async assign(req, res, next) {
    try {
      const cardId = parseInt(req.params.id, 10);
      if (isNaN(cardId)) {
        return res.status(400).json({ error: 'Invalid card ID' });
      }

      const { userId } = req.body;
      const actorId = req.user?.id;

      const card = await nfcCardService.assignCard(cardId, {
        userId: parseInt(userId, 10),
        actorId,
      });

      return res.json({ card });
    } catch (err) {
      return next(err);
    }
  },

  async lifecycle(req, res, next) {
    try {
      const card = await cardLifecycleService.transition({
        cardId: parseInt(req.params.id, 10), targetStatus: req.validated.status,
        reason: req.validated.reason, actor: req.user,
      });
      return res.json({ card });
    } catch (error) { return next(error); }
  },

  async replace(req, res, next) {
    try {
      const result = await cardLifecycleService.replace({
        cardId: parseInt(req.params.id, 10), newCardLabel: req.validated.newCardLabel,
        reason: req.validated.reason, actor: req.user,
      });
      return res.status(201).json(result);
    } catch (error) { return next(error); }
  },
};
