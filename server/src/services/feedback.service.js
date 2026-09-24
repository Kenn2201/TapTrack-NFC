import { feedbackRepository } from '../repositories/feedback.repository.js';
import { auditService } from './audit.service.js';

const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

export const feedbackService = {
  async submit({ actor, category, rating, message, page, reproduction, allowAnonymous = false }) {
    if (!actor && !allowAnonymous) throw fail(401, 'UNAUTHENTICATED', 'Please log in to submit feedback.');
    const feedback = await feedbackRepository.create({
      userId: actor?.id || null,
      category,
      rating,
      message,
      page,
      reproduction,
    });
    if (actor) {
      await auditService.log({
        actorId: actor.id,
        action: 'FEEDBACK_SUBMITTED',
        entityType: 'FEEDBACK',
        entityId: feedback.id,
        metadata: { category, rating },
      });
    }
    return feedback;
  },

  async list({ status = null, actor }) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can view feedback.');
    return feedbackRepository.list({ status });
  },

  async updateStatus(id, status, actor) {
    if (actor?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can triage feedback.');
    const feedback = await feedbackRepository.updateStatus(id, status);
    if (!feedback) throw fail(404, 'FEEDBACK_NOT_FOUND', 'Feedback not found.');
    await auditService.log({ actorId: actor.id, action: 'FEEDBACK_STATUS_UPDATED', entityType: 'FEEDBACK', entityId: id, metadata: { status } });
    return feedback;
  },
};

export default feedbackService;
