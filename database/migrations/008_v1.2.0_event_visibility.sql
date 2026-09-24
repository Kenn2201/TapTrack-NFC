-- ============================================================================
-- TapTrack NFC v1.2.0 — Event Visibility Model
-- Adds PUBLIC / INVITE_ONLY event visibility while preserving existing events.
-- Existing rows remain PUBLIC by default.
-- Safe to run repeatedly. No destructive operations.
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE event_visibility AS ENUM ('PUBLIC', 'INVITE_ONLY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS visibility event_visibility NOT NULL DEFAULT 'PUBLIC';

UPDATE events
SET visibility = 'PUBLIC'
WHERE visibility IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_visibility ON events(visibility);
