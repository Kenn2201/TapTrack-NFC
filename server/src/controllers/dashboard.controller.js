import { dashboardRepository } from '../repositories/dashboard.repository.js';
export const dashboardController = {
  async get(req, res, next) { try { res.json({ metrics: await dashboardRepository.getMetrics() }); } catch (e) { next(e); } },
};
