// Audit service — audit log recording
// Implementation planned for v0.7.0 BETA
export const auditService = {
  async log({ actorId, action, entityType, entityId, metadata }) {
    throw new Error('Not implemented');
  },
};
