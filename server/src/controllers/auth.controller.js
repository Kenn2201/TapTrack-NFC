import jwt from 'jsonwebtoken';
import { config, getJwtSecret } from '../config/index.js';
import { authService, toSafeUser } from '../services/auth.service.js';
import { userRepository } from '../repositories/user.repository.js';

export const authController = {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;
      const user = await authService.register({ email, password, firstName, lastName });
      return res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login({ email, password });

      // Store JWT strictly in HttpOnly cookie
      res.cookie(config.cookieName, token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Response payload NEVER contains the JWT
      return res.json({
        message: 'Login successful.',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    // Invalidate the user's active sessions when a vald session is present
    if (req.user?.id) {
      try {
        await userRepository.revokeAllSessions(req.user.id);
      } catch {
        // best effort — the cookie is cleared regardless
      }
    }
    res.clearCookie(config.cookieName, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return res.json({ message: 'Logged out successfully.' });
  },

  /**
   * GET /api/auth/me
   */
  async me(req, res) {
    // req.user is guaranteed by authenticate middleware
    return res.json({ user: req.user });
  },

  /**
   * POST /api/auth/verify-email
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;
      const user = await authService.verifyEmail(token);
      return res.json({
        message: 'Email address verified successfully.',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/resend-verification
   */
  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerification(email);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword({ token, password });
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/users/me
   * Allows authenticated users to update their own profile
   */
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, nickname, birthday, avatarUrl } = req.body;
      const updated = await userRepository.updateProfile(req.user.id, { firstName, lastName, nickname, birthday, avatarUrl });
      return res.json({
        message: 'Profile updated successfully.',
        user: toSafeUser(updated),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/users/me/password
   * Change the current user's password and invalidate other sessions.
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword({ userId: req.user.id, currentPassword, newPassword });

      // One-active-session model: the password change bumped session_version,
      // invalidating every previously issued cookie. Re-issue a fresh cookie so
      // THIS session stays valid while all other sessions are signed out.
      const secret = getJwtSecret();
      const token = jwt.sign(
        {
          sub: result.user.id,
          email: result.user.email,
          role: result.user.role,
          ver: result.sessionVersion,
        },
        secret,
        { expiresIn: config.jwtExpiresIn }
      );
      res.cookie(config.cookieName, token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ message: result.message, user: result.user });
    } catch (err) {
      next(err);
    }
  },
};

export default authController;
