import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const drizzleRoot = path.join(serverRoot, 'drizzle');

function read(relative) {
  return fs.readFileSync(path.join(drizzleRoot, relative), 'utf8');
}

describe('Drizzle production migration ledger', () => {
  it('tracks only the pending v1.2 database changes and never re-runs migration 007', () => {
    const journal = JSON.parse(read(path.join('meta', '_journal.json')));
    expect(journal.dialect).toBe('postgresql');
    expect(journal.entries).toHaveLength(3);
    expect(journal.entries.map((entry) => entry.tag)).toEqual([
      '0000_v1_2_event_visibility',
      '0001_v1_2_card_requests',
      '0002_v1_2_public_feedback',
    ]);
    expect(journal.entries.some((entry) => /007|saas/i.test(entry.tag))).toBe(false);
    expect(journal.entries.map((entry) => entry.when)).toEqual(
      [...journal.entries.map((entry) => entry.when)].sort((a, b) => a - b)
    );
  });

  it('keeps event visibility adoption idempotent', () => {
    const sql = read('0000_v1_2_event_visibility.sql');
    expect(sql).toMatch(/duplicate_object/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS visibility/);
    expect(sql).toMatch(/DEFAULT 'PUBLIC'/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_events_visibility/);
  });

  it('refuses to silently repair duplicate ACTIVE cards', () => {
    const sql = read('0001_v1_2_card_requests.sql');
    expect(sql).toMatch(/HAVING COUNT\(\*\) > 1/);
    expect(sql).toMatch(/RAISE EXCEPTION/);
    expect(sql).toMatch(/uq_nfc_cards_one_active_per_user/);
    expect(sql).not.toMatch(/UPDATE\s+nfc_cards[\s\S]+status\s*=\s*'(?:LOST|REVOKED|DISABLED|REPLACED)'/i);
  });

  it('makes feedback ownership optional without deleting feedback', () => {
    const sql = read('0002_v1_2_public_feedback.sql');
    expect(sql).toMatch(/ALTER COLUMN user_id DROP NOT NULL/);
    expect(sql).not.toMatch(/DROP TABLE|DELETE FROM/i);
  });
});
