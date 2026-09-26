import 'dotenv/config';
import fs from 'node:fs';

const packageJson = JSON.parse(
  fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')
);

export const config = {
  get version() { return packageJson.version || '1.0.0'; },
  get port() { return process.env.PORT || 3001; },
  get nodeEnv() { return process.env.NODE_ENV || 'development'; },
  get databaseUrl() { return process.env.DATABASE_URL; },
  get clientUrl() { return process.env.CLIENT_URL || 'http://localhost:5173'; },
  get nfcDomain() { return process.env.NFC_DOMAIN || 'https://nfc.kenncode.me'; },
  get logLevel() { return process.env.LOG_LEVEL || 'info'; },
  get autoMigrate() { return process.env.AUTO_MIGRATE !== 'false'; },

  // Authentication
  get jwtSecret() { return process.env.JWT_SECRET; },
  get jwtExpiresIn() { return process.env.JWT_EXPIRES_IN || '7d'; },
  cookieName: 'taptrack_session',

  // NFC Card Security
  get cardTokenPepper() { return process.env.CARD_TOKEN_PEPPER; },

  // Resend Email
  get resendApiKey() { return process.env.RESEND_API_KEY; },
  get resendFromEmail() { return process.env.RESEND_FROM_EMAIL || 'TapTrack NFC <no-reply@mail.nfc.kenncode.me>'; },
};

/**
 * Returns JWT_SECRET or throws an error.
 * Ensures no default or fallback secret is ever used.
 */
export function getJwtSecret() {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is required but not configured. Authentication cannot operate safely.');
  }
  return config.jwtSecret;
}

/**
 * Returns CARD_TOKEN_PEPPER or throws an error.
 * Ensures no default or fallback pepper is ever used in credential hashing.
 */
export function getCardTokenPepper() {
  if (!config.cardTokenPepper) {
    throw new Error('CARD_TOKEN_PEPPER is required but not configured. NFC credential operations cannot operate safely.');
  }
  return config.cardTokenPepper;
}
