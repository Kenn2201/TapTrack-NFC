import { auditRepository } from '../repositories/audit.repository.js';
const forbidden = /password|secret|token|hash|cookie|credential|database_url|api[_-]?key/i;
export function sanitizeAuditMetadata(value) {
  if (Array.isArray(value)) return value.map(sanitizeAuditMetadata);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !forbidden.test(key)).map(([key, child]) => [key, sanitizeAuditMetadata(child)]));
}
export const auditService = {
  log({ actorId, action, entityType, entityId, metadata = {} }) { return auditRepository.create({ actorId, action, entityType, entityId, metadata: sanitizeAuditMetadata(metadata) }); },
  list(options) { return auditRepository.list(options); },
};
