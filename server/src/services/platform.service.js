import { settingsRepository } from '../repositories/settings.repository.js';
import { auditService } from './audit.service.js';

export const platformService = {
  getSettings() {
    return settingsRepository.get();
  },

  /**
   * Toggle global maintenance mode. Only administrators may do this.
   * Keeps a single additively-configured platform_settings row.
   */
  async setMaintenance({ enabled, message, estimatedReturn, releaseLabel, actor }) {
    if (actor?.role !== 'ADMIN') {
      throw Object.assign(new Error('Only administrators can manage maintenance mode.'), { status: 403, code: 'FORBIDDEN' });
    }
    const updated = await settingsRepository.update({
      enabled,
      message,
      estimatedReturn,
      releaseLabel,
      updatedBy: actor.id,
    });
    await auditService.log({
      actorId: actor.id,
      action: enabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
      entityType: 'PLATFORM',
      entityId: 1,
      metadata: { message, estimatedReturn, releaseLabel },
    });
    return updated;
  },
};

export default platformService;