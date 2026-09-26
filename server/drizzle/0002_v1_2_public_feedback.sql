-- TapTrack NFC v1.2.0 — Drizzle-managed anonymous public feedback migration
-- Mirrors database/migrations/010_v1.2.0_public_feedback.sql.

ALTER TABLE feedback
  ALTER COLUMN user_id DROP NOT NULL;
