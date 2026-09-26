import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pool from '../src/repositories/db.js';
import { runMigrations } from '../src/db/migrate.js';

if (process.env.MIGRATION_QA_RESET !== 'true' || process.env.NODE_ENV !== 'test') {
  throw new Error('Migration QA reset is test-only. Set NODE_ENV=test and MIGRATION_QA_RESET=true.');
}

const schemaPath = fileURLToPath(new URL('../../database/schema.sql', import.meta.url));
const migration007Path = fileURLToPath(new URL('../../database/migrations/007_v1.1.0_saas_pass.sql', import.meta.url));

async function scalar(client, query, params = []) {
  const result = await client.query(query, params);
  return result.rows[0];
}

async function main() {
  const client = await pool.connect();

  try {
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE;');
    await client.query('CREATE SCHEMA public;');

    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    const migration007Sql = await fs.readFile(migration007Path, 'utf8');

    await client.query(schemaSql);
    await client.query(migration007Sql);
  } finally {
    client.release();
  }

  await runMigrations();

  const verify = await pool.connect();
  try {
    const visibility = await scalar(verify, `
      SELECT data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'events'
        AND column_name = 'visibility';
    `);
    if (!visibility || visibility.is_nullable !== 'NO') {
      throw new Error('events.visibility was not created as NOT NULL.');
    }

    const cardRequests = await scalar(verify, `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'card_requests'
      ) AS exists;
    `);
    if (!cardRequests?.exists) {
      throw new Error('card_requests table was not created.');
    }

    const publicFeedback = await scalar(verify, `
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'feedback'
        AND column_name = 'user_id';
    `);
    if (publicFeedback?.is_nullable !== 'YES') {
      throw new Error('feedback.user_id is still NOT NULL.');
    }

    const activeCardIndex = await scalar(verify, `
      SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'nfc_cards'
          AND indexname = 'uq_nfc_cards_one_active_per_user'
      ) AS exists;
    `);
    if (!activeCardIndex?.exists) {
      throw new Error('one-ACTIVE-card unique index was not created.');
    }

    const ledger = await scalar(verify, 'SELECT COUNT(*)::int AS count FROM drizzle.__drizzle_migrations;');
    if (Number(ledger?.count) !== 3) {
      throw new Error(`Expected 3 Drizzle migrations, found ${ledger?.count ?? 0}.`);
    }
  } finally {
    verify.release();
  }

  // Prove deploy restart safety: rerunning must be a no-op in the ledger.
  await runMigrations();

  const finalClient = await pool.connect();
  try {
    const ledger = await scalar(finalClient, 'SELECT COUNT(*)::int AS count FROM drizzle.__drizzle_migrations;');
    if (Number(ledger?.count) !== 3) {
      throw new Error('Drizzle migration rerun changed the migration ledger unexpectedly.');
    }
  } finally {
    finalClient.release();
  }

  console.log('Drizzle migration QA passed: 008/009/010 applied once and verified.');
}

main()
  .finally(() => pool.end())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
