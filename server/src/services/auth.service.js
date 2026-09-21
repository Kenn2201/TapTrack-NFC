import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config, getJwtSecret } from '../config/index.js';
import { userRepository } from '../repositories/user.repository.js';
import { tokenRepository } from '../repositories/token.repository.js';
import { emailService } from './email.service.js';

const BCRYPT_ROUNDS = 10;

/**
 * Strips sensitive fields like password_hash and normalizes camelCase keys
 */
export function toSafeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.email_verified_at || user.emailVerifiedAt,
    createdAt: user.created_at || user.createdAt,
    updatedAt: user.updated_at || user.updatedAt,
  };
}

/**
 * SHA-256 hash helper for verification & reset tokens
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export const authService = {
  /**
   * Register a new user
   * Public registration can ONLY create USER role
   */
  async register({ email, password, firstName, lastName }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      const err = new Error('An account with this email address already exists.');
      err.status = 409;
      throw err;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user (strictly USER role, ACTIVE status)
    const newUser = await userRepository.create({
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName,
      role: 'USER',
      status: 'ACTIVE',
    });

    // Generate random raw token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await tokenRepository.createEmailVerificationToken({
      userId: newUser.id,
      tokenHash,
      expiresAt,
    });

    // Dispatch verification email (non-blocking for registration success in local dev)
    try {
      await emailService.sendVerificationEmail({
        to: newUser.email,
        firstName: newUser.first_name,
        token: rawToken,
      });
    } catch (emailErr) {
      console.error('[AuthService] Verification email dispatch failed:', emailErr.message);
      if (config.nodeEnv === 'production') {
        throw new Error('Registration succeeded, but failed to send verification email. Please try resending verification.');
      }
    }

    return toSafeUser(newUser);
  },

  /**
   * Login user with email and password
   */
  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    // Check if account is disabled
    if (user.status === 'DISABLED') {
      const err = new Error('Your account has been disabled. Please contact an administrator.');
      err.status = 403;
      throw err;
    }

    // Issue JWT
    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      user: toSafeUser(user),
      token,
    };
  },

  /**
   * Verify email via one-time raw token
   */
  async verifyEmail(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      const err = new Error('Invalid verification token.');
      err.status = 400;
      throw err;
    }

    const tokenHash = hashToken(rawToken);
    const record = await tokenRepository.findEmailVerificationToken(tokenHash);

    if (!record) {
      const err = new Error('Verification token is invalid or has already been used.');
      err.status = 400;
      throw err;
    }

    if (new Date(record.expires_at) < new Date()) {
      await tokenRepository.deleteEmailVerificationToken(record.id);
      const err = new Error('Verification token has expired. Please request a new verification email.');
      err.status = 400;
      throw err;
    }

    // Mark verified
    const updatedUser = await userRepository.setEmailVerified(record.user_id);

    // One-time use: consume token
    await tokenRepository.deleteEmailVerificationToken(record.id);

    return toSafeUser(updatedUser);
  },

  /**
   * Resend verification email
   */
  async resendVerification(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);

    // Generic safe response to avoid enumeration
    if (!user || user.email_verified_at || user.status === 'DISABLED') {
      return { message: 'If an unverified active account exists for that email, a verification link has been sent.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await tokenRepository.createEmailVerificationToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    try {
      await emailService.sendVerificationEmail({
        to: user.email,
        firstName: user.first_name,
        token: rawToken,
      });
    } catch (emailErr) {
      console.error('[AuthService] Resend verification email dispatch failed:', emailErr.message);
    }

    return { message: 'If an unverified active account exists for that email, a verification link has been sent.' };
  },

  /**
   * Initiate password reset
   */
  async forgotPassword(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);

    // Generic safe response to prevent user enumeration
    if (user && user.status === 'ACTIVE') {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await tokenRepository.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      try {
        await emailService.sendPasswordResetEmail({
          to: user.email,
          firstName: user.first_name,
          token: rawToken,
        });
      } catch (emailErr) {
        console.error('[AuthService] Password reset email dispatch failed:', emailErr.message);
      }
    }

    return { message: 'If an account exists for that email, a password reset link has been sent.' };
  },

  /**
   * Complete password reset using raw token
   */
  async resetPassword({ token: rawToken, password }) {
    if (!rawToken || typeof rawToken !== 'string') {
      const err = new Error('Invalid reset token.');
      err.status = 400;
      throw err;
    }

    const tokenHash = hashToken(rawToken);
    const record = await tokenRepository.findPasswordResetToken(tokenHash);

    if (!record) {
      const err = new Error('Password reset link is invalid or has already been used.');
      err.status = 400;
      throw err;
    }

    if (new Date(record.expires_at) < new Date()) {
      await tokenRepository.markPasswordResetTokenUsed(record.id);
      const err = new Error('Password reset link has expired. Please request a new one.');
      err.status = 400;
      throw err;
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update password
    await userRepository.updatePassword(record.user_id, passwordHash);

    // Invalidate token (one-time use)
    await tokenRepository.markPasswordResetTokenUsed(record.id);

    return { message: 'Password has been successfully reset. You may now log in.' };
  },
};

export default authService;
