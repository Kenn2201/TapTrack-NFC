import { userRepository } from '../repositories/user.repository.js';
import { toSafeUser } from '../services/auth.service.js';
import { emailService } from '../services/email.service.js';

export const adminUserController = {
  /**
   * GET /api/admin/users
   * List all users
   */
  async getAllUsers(req, res, next) {
    try {
      const users = await userRepository.findAll();
      const safeUsers = users.map(toSafeUser);
      return res.json({ users: safeUsers });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/users/:id
   * Get single user details
   */
  async getUserById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const user = await userRepository.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ user: toSafeUser(user) });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/users/:id/role
   * Update role: USER <-> OPERATOR
   */
  async updateUserRole(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const { role } = req.body;
      const targetUser = await userRepository.findById(id);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent admin from changing their own role (avoid lockout)
      if (targetUser.id === req.user.id) {
        return res.status(400).json({ error: 'You cannot alter your own administrator role.' });
      }

      // Update role
      const updated = await userRepository.updateRole(id, role);

      // Notify user via transactional email
      try {
        await emailService.sendRoleChangeEmail({
          to: updated.email,
          firstName: updated.first_name,
          newRole: role,
        });
      } catch (emailErr) {
        console.error('[AdminUser] Failed to send role change email notification:', emailErr.message);
      }

      return res.json({
        message: `User role successfully updated to ${role}.`,
        user: toSafeUser(updated),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/users/:id/status
   * Update status: ACTIVE <-> DISABLED
   */
  async updateUserStatus(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const { status } = req.body;
      const targetUser = await userRepository.findById(id);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent admin from disabling their own account
      if (targetUser.id === req.user.id && status === 'DISABLED') {
        return res.status(400).json({ error: 'You cannot disable your own active administrator account.' });
      }

      const updated = await userRepository.updateStatus(id, status);

      // Notify user via transactional email
      try {
        await emailService.sendStatusChangeEmail({
          to: updated.email,
          firstName: updated.first_name,
          newStatus: status,
        });
      } catch (emailErr) {
        console.error('[AdminUser] Failed to send status change email notification:', emailErr.message);
      }

      return res.json({
        message: `User status successfully updated to ${status}.`,
        user: toSafeUser(updated),
      });
    } catch (err) {
      next(err);
    }
  },
};

export default adminUserController;
