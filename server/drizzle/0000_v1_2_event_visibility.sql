-- TapTrack NFC v1.2.0 — Drizzle-managed event visibility migration
-- Mirrors database/migrations/008_v1.2.0_event_visibility.sql.
-- Idempotent so a database that received 008 manually can still be adopted by
-- the Drizzle migration ledger safely.

DO $$ BEGIN
  CREATE TYPE event_visibility AS ENUM ('PUBLIC', 'INVITE_ONLY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS visibility event_visibility NOT NULL DEFAULT 'PUBLIC';
--> statement-breakpoint

UPDATE events
SET visibility = 'PUBLIC'
WHERE visibility IS NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_events_visibility ON events(visibility);
