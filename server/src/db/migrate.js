import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pool from '../repositories/db.js';
import { config } from '../config/index.js';

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));
const MIGRATION_LOCK_ID = 7481270126;

export async function runMigrations() {
  if (!config.autoMigrate) {
    return { skipped: true, reason: 'AUTO_MIGRATE=false' };
  }

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required before database migrations can run.');
  }

  const client = await pool.connect();
  let lockAcquired = false;

  try {
    // Serialize deploy-time migrations when multiple instances start together.
    // This session-level lock stays on the same pg client used by Drizzle.
    await client.query('SELECT pg_advisory_lock($1::bigint);', [MIGRATION_LOCK_ID]);
    lockAcquired = true;

    const db = drizzle(client);
    await migrate(db, { migrationsFolder });

    return { skipped: false };
  } finally {
    if (lockAcquired) {
      try {
        await client.query('SELECT pg_advisory_unlock($1::bigint);', [MIGRATION_LOCK_ID]);
      } catch {
        // The connection will be released immediately; do not mask the migration result.
      }
    }
    client.release();
  }
}

export default runMigrations;
