import { eventParticipantsService } from '../services/eventParticipants.service.js';

export const eventParticipantsController = {
  async invite(req, res, next) {
    try {
      res.status(201).json({
        participants: await eventParticipantsService.invite({
          eventId: Number(req.params.id),
          userIds: req.validated.userIds,
          actor: req.user,
        }),
      });
    } catch (e) { next(e); }
  },

  async list(req, res, next) {
    try {
      res.json({
        participants: await eventParticipantsService.list({
          eventId: Number(req.params.id),
          actor: req.user,
        }),
      });
    } catch (e) { next(e); }
  },
};

export default eventParticipantsController;
