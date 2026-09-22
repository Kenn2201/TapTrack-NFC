import { feedbackService } from '../services/feedback.service.js';

export const feedbackController = {
  async submit(req, res, next) {
    try {
      res.status(201).json({ feedback: await feedbackService.submit({ ...req.validated, actor: req.user }) });
    } catch (e) { next(e); }
  },
  async list(req, res, next) {
    try {
      res.json({ feedback: await feedbackService.list({ status: req.query.status || null, actor: req.user }) });
    } catch (e) { next(e); }
  },
  async updateStatus(req, res, next) {
    try {
      res.json({ feedback: await feedbackService.updateStatus(Number(req.params.id), req.validated.status, req.user) });
    } catch (e) { next(e); }
  },
};

export default feedbackController;
