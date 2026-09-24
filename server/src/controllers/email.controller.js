import { emailService } from '../services/email.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { auditService } from '../services/audit.service.js';

const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const id = (v) => Number.parseInt(v, 10);

export const emailController = {
  async send(req, res, next) {
    try {
      const { to, subject, html, text, template } = req.validated;
      if (!to) throw fail(400, 'RECIPIENT_REQUIRED', 'A recipient email is required for direct sends.');
      const result = await emailService.sendEmail({ to, subject, html, text });
      await auditService.log({ actorId: req.user.id, action: 'EMAIL_SENT', entityType: 'PLATFORM', entityId: null, metadata: { to, subject, template: template || 'GENERIC' } });
      return res.json({ message: 'Email sent.', id: result?.id });
    } catch (e) { return next(e); }
  },

  async broadcast(req, res, next) {
    try {
      if (req.user?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can broadcast email.');
      const { subject, html, text } = req.validated;
      if (!req.validated.confirmBroadcast) throw fail(400, 'BROADCAST_CONFIRMATION_REQUIRED', 'confirmation is required before broadcasting.');
      const users = await userRepository.findAll();
      const recipients = users.filter((u) => u.status === 'ACTIVE' && u.emailVerifiedAt);
      let sent = 0;
      for (const u of recipients) {
        await emailService.sendEmail({ to: u.email, subject, html, text });
        sent += 1;
      }
      await auditService.log({ actorId: req.user.id, action: 'EMAIL_BROADCAST', entityType: 'PLATFORM', entityId: null, metadata: { subject, recipients: sent } });
      return res.json({ message: `Broadcast sent to ${sent} recipient(s).`, sent });
    } catch (e) { return next(e); }
  },

  async diagnostics(req, res, next) {
    try {
      if (req.user?.role !== 'ADMIN') throw fail(403, 'FORBIDDEN', 'Only administrators can view email diagnostics.');
      return res.json({ diagnostics: { configured: Boolean(process.env.RESEND_API_KEY), provider: 'RESEND', maintenanceMode: false } });
    } catch (e) { return next(e); }
  },
};

export default emailController;