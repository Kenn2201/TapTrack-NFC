-- ============================================================================
-- TapTrack NFC v1.1.0 SaaS Pass — Additive Migration
-- Adds: profile/security user fields, one-active-session versioning,
--        maintenance platform settings, feedback, event participants.
-- Safe to run repeatedly. No destructive operations.
-- ============================================================================

-- ─── USERS: profile, timestamps, and session security ────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version BIGINT NOT NULL DEFAULT 0;

-- ─── EVENTS: optional location for event detail pages ───────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Guarantee every lifecycle status value exists on the enum regardless of the
-- order migrations were applied in a given database. Prevents the historic
-- "500 internal server error" when marking LOST / REVOKED / DISABLED against a
-- database whose card_status enum predates those values.
DO $$ BEGIN
  ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'LOST';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'REVOKED';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'DISABLED';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'REPLACED';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── FEEDBACK ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE feedback_category AS ENUM ('BUG', 'UX', 'FEATURE_REQUEST', 'NFC_ATTENDANCE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE feedback_status AS ENUM ('NEW', 'REVIEWING', 'RESOLVED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS feedback (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    feedback_category NOT NULL DEFAULT 'OTHER',
  rating      INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  message     TEXT NOT NULL,
  page        VARCHAR(300),
  reproduction TEXT,
  status      feedback_status NOT NULL DEFAULT 'NEW',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);

-- ─── PLATFORM SETTINGS (maintenance mode) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  id                       INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_message      TEXT,
  estimated_return         VARCHAR(120),
  release_label            VARCHAR(50),
  updated_by               INTEGER REFERENCES users(id),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (id, maintenance_enabled, maintenance_message, estimated_return, release_label)
VALUES (1, FALSE, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ─── EVENT PARTICIPANTS (invitations) ───────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS event_participants (
  id          SERIAL PRIMARY KEY,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      invitation_status NOT NULL DEFAULT 'INVITED',
  invited_by  INTEGER REFERENCES users(id),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_event_participant UNIQUE (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);