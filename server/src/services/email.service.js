import { Resend } from 'resend';
import { config } from '../config/index.js';

// Lazy-initialize Resend client only if API key is present
let resendClient = null;
function getResendClient() {
  if (!resendClient && config.resendApiKey) {
    resendClient = new Resend(config.resendApiKey);
  }
  return resendClient;
}

export const emailService = {
  /**
   * Send Email Verification
   */
  async sendVerificationEmail({ to, firstName, token }) {
    const verifyUrl = `${config.clientUrl}/auth/verify?token=${encodeURIComponent(token)}`;
    const subject = 'Verify your email — TapTrack NFC';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to TapTrack NFC, ${firstName || 'there'}!</h2>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Thank you for creating an account. Please verify your email address to activate your account and gain full access.
        </p>
        <div style="margin: 28px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          This link will expire in 24 hours. If the button above does not work, copy and paste this URL into your browser:<br/>
          <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">
          TapTrack NFC — Mobile-first NFC technology proof-of-concept. If you did not create this account, please disregard this email.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordResetEmail({ to, firstName, token }) {
    const resetUrl = `${config.clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'Password Reset Request — TapTrack NFC';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Reset Your Password</h2>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Hello ${firstName || ''}, we received a request to reset your password for TapTrack NFC.
        </p>
        <div style="margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          This link is valid for 1 hour and can only be used once. If you did not request a password reset, you can safely ignore this email; your account remains secure.
        </p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; word-break: break-all;">
          Direct link: <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">
          TapTrack NFC — Mobile-first NFC technology proof-of-concept.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  },

  /**
   * Send Role Change Notification
   */
  async sendRoleChangeEmail({ to, firstName, newRole }) {
    const subject = 'Your TapTrack NFC Account Role Has Changed';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Account Update</h2>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Hello ${firstName || ''}, an administrator has updated your account role in TapTrack NFC to: <strong>${newRole}</strong>.
        </p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Please log in to your dashboard to review your available capabilities.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  },

  /**
   * Send Account Status Change Notification (Disabled / Reactivated)
   */
  async sendStatusChangeEmail({ to, firstName, newStatus }) {
    const subject = `Your TapTrack NFC Account Status: ${newStatus}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Account Status Notification</h2>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Hello ${firstName || ''}, your TapTrack NFC account status has been updated to: <strong>${newStatus}</strong>.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  },

  /**
   * Low-level dispatch via Resend
   */
  async sendEmail({ to, subject, html, text }) {
    const client = getResendClient();

    if (!client) {
      if (config.nodeEnv === 'production') {
        throw new Error('Email service misconfigured: RESEND_API_KEY is missing in production environment.');
      }
      // Safe local development fallback: Log clearly without crashing
      console.log(`[EmailService:DEV_LOCAL] Simulated send to: ${to} | Subject: "${subject}"`);
      return { id: 'dev-simulated-id', success: true };
    }

    try {
      const payload = {
        from: config.resendFromEmail,
        to: [to],
        subject,
      };
      if (html?.trim()) payload.html = html;
      if (text?.trim()) payload.text = text;

      const response = await client.emails.send(payload);

      if (response.error) {
        console.error('[EmailService] Resend API error:', response.error);
        throw new Error(`Email delivery failed: ${response.error.message || 'Unknown Resend error'}`);
      }

      return { id: response.data?.id, success: true };
    } catch (err) {
      console.error('[EmailService] Unexpected error sending email:', err.message);
      throw err;
    }
  },
};

export default emailService;
