-- TapTrack NFC v1.0.0: Legacy Event Compatibility Migration
-- Safely make legacy starts_at and ends_at columns nullable if they exist in legacy tables,
-- ensuring inserts into canonical start_at / end_at succeed without constraint violations.
-- DO NOT RUN ON PRODUCTION AUTOMATICALLY.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'starts_at' AND is_nullable = 'NO'
  ) THEN
    EXECUTE 'ALTER TABLE events ALTER COLUMN starts_at DROP NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'ends_at' AND is_nullable = 'NO'
  ) THEN
    EXECUTE 'ALTER TABLE events ALTER COLUMN ends_at DROP NOT NULL';
  END IF;
END $$;
