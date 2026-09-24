import { cardRequestService } from '../services/cardRequest.service.js';

export const cardRequestController = {
  async createMine(req, res, next) {
    try {
      const request = await cardRequestService.createForUser({
        userId: req.user.id,
        requestType: req.validated.requestType,
        note: req.validated.note,
      });
      return res.status(201).json({ request });
    } catch (error) { return next(error); }
  },

  async listMine(req, res, next) {
    try {
      return res.json({ requests: await cardRequestService.listMine(req.user.id) });
    } catch (error) { return next(error); }
  },

  async listAdmin(req, res, next) {
    try {
      return res.json({
        requests: await cardRequestService.listAll({ status: req.query.status || null }, req.user),
      });
    } catch (error) { return next(error); }
  },

  async updateStatus(req, res, next) {
    try {
      const request = await cardRequestService.updateStatus({
        id: Number(req.params.id),
        status: req.validated.status,
        adminNote: req.validated.adminNote,
        actor: req.user,
      });
      return res.json({ request });
    } catch (error) { return next(error); }
  },
};

export default cardRequestController;
