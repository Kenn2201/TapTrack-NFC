-- TapTrack NFC v0.6.0 BETA: events, attendance sessions, and attendance records.
-- Additive and safe for existing user/card data. Do not run seed.sql with this migration.

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'CLOSED';

DO $$ BEGIN
  CREATE TYPE attendance_session_status AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_method AS ENUM ('NFC_WEB', 'NFC_URL', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status event_status NOT NULL DEFAULT 'DRAFT',
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_valid_window CHECK (end_at > start_at)
);

-- Older fresh-install schemas used starts_at/ends_at. Preserve and normalize them.
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'starts_at') THEN
    EXECUTE 'UPDATE events SET start_at = starts_at WHERE start_at IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'ends_at') THEN
    EXECUTE 'UPDATE events SET end_at = ends_at WHERE end_at IS NULL';
  END IF;
END $$;
ALTER TABLE events ALTER COLUMN start_at SET NOT NULL;
ALTER TABLE events ALTER COLUMN end_at SET NOT NULL;

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  status attendance_session_status NOT NULL DEFAULT 'OPEN',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opened_by INTEGER NOT NULL REFERENCES users(id),
  closed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attendance_sessions_close_state CHECK (
    (status = 'OPEN' AND closed_at IS NULL AND closed_by IS NULL)
    OR (status = 'CLOSED' AND closed_at IS NOT NULL AND closed_by IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_sessions_one_open_event
  ON attendance_sessions(event_id) WHERE status = 'OPEN';

CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE RESTRICT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  card_id INTEGER REFERENCES nfc_cards(id) ON DELETE RESTRICT,
  method attendance_method NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attendance_nfc_requires_card CHECK (
    (method IN ('NFC_WEB', 'NFC_URL') AND card_id IS NOT NULL)
    OR (method = 'MANUAL')
  ),
  CONSTRAINT uq_attendance_records_user_session UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_events_status_start ON events(status, start_at);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_event ON attendance_sessions(event_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_event_time ON attendance_records(event_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_time ON attendance_records(user_id, recorded_at DESC);
