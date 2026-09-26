import pino from 'pino';
import app from './app.js';
import { config } from './config/index.js';
import { runMigrations } from './db/migrate.js';

const logger = pino({ level: config.logLevel || 'info' });
const PORT = config.port || 3001;

async function start() {
  logger.info({ autoMigrate: config.autoMigrate }, 'Checking database migrations before API startup');

  const migrationResult = await runMigrations();
  if (migrationResult.skipped) {
    logger.warn({ reason: migrationResult.reason }, 'Automatic database migrations skipped');
  } else {
    logger.info('Database migrations are up to date');
  }

  app.listen(PORT, () => {
    logger.info(`TapTrack NFC API running on port ${PORT}`);
  });
}

start().catch((error) => {
  logger.error(
    {
      err: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
      },
    },
    'TapTrack API startup failed before listening'
  );
  process.exit(1);
});
