import { platformService } from '../services/platform.service.js';

export const platformController = {
  /**
   * GET /api/platform/maintenance-status (public)
   */
  async getStatus(req, res, next) {
    try {
      return res.json({ maintenance: await platformService.getSettings() });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/admin/platform/maintenance (ADMIN only)
   */
  async setMaintenance(req, res, next) {
    try {
      const updated = await platformService.setMaintenance({ ...req.validated, actor: req.user });
      return res.json({ message: updated.maintenanceEnabled ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.', ...updated });
    } catch (err) {
      return next(err);
    }
  },
};

export default platformController;