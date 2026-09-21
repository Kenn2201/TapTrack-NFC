import { activityPulseService } from '../services/activityPulse.service.js';
export const activityPulseController = { async get(req, res, next) { try { res.json({ activityPulse: await activityPulseService.getForUser(req.user.id) }); } catch (e) { next(e); } } };
