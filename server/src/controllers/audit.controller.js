import { auditService } from '../services/audit.service.js';
export const auditController = { async list(req, res, next) { try { res.json({ audits: await auditService.list() }); } catch (e) { next(e); } } };
