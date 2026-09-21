import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nfcDomain: process.env.NFC_DOMAIN || 'https://nfc.kenncode.me',
  logLevel: process.env.LOG_LEVEL || 'info',
};
