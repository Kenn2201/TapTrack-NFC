-- ============================================================================
-- TapTrack NFC — Database Schema
-- PostgreSQL
-- Version: 0.2.0 ALPHA (In Development)
-- ============================================================================

-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'OPERATOR', 'USER');
CREATE TYPE card_status AS ENUM ('UNASSIGNED', 'ACTIVE', 'REVOKED', 'LOST', 'REPLACED', 'DISABLED');
CREATE TYPE event_status AS ENUM ('DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE attendance_method AS ENUM ('NFC_WEB', 'NFC_URL', 'MANUAL');
CREATE TYPE session_status AS ENUM ('OPEN', 'CLOSED', 'EXPIRED');

-- Users
CREATE TABLE users (
    id                  SERIAL PRIMARY KEY,
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    role                user_role NOT NULL DEFAULT 'USER',
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    email_verified_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Verification Tokens
CREATE TABLE email_verification_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NFC Cards
CREATE TABLE nfc_cards (
    id                  SERIAL PRIMARY KEY,
    card_label          VARCHAR(50) UNIQUE NOT NULL,       -- e.g. NFC-001
    user_id             INTEGER REFERENCES users(id),
    token_hash          VARCHAR(64) UNIQUE NOT NULL,       -- SHA-256 of raw credential
    status              card_status NOT NULL DEFAULT 'UNASSIGNED',
    issued_at           TIMESTAMPTZ,
    issued_by           INTEGER REFERENCES users(id),
    revoked_at          TIMESTAMPTZ,
    revoked_by          INTEGER REFERENCES users(id),
    revocation_reason   VARCHAR(100),
    replaced_by_card_id INTEGER REFERENCES nfc_cards(id),
    last_used_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events
CREATE TABLE events (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    location    VARCHAR(200),
    starts_at   TIMESTAMPTZ NOT NULL,
    ends_at     TIMESTAMPTZ NOT NULL,
    status      event_status NOT NULL DEFAULT 'DRAFT',
    created_by  INTEGER REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event Participants
CREATE TABLE event_participants (
    event_id    INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- Check-in Sessions
CREATE TABLE checkin_sessions (
    id          SERIAL PRIMARY KEY,
    event_id    INTEGER REFERENCES events(id) NOT NULL,
    opened_by   INTEGER REFERENCES users(id) NOT NULL,
    status      session_status NOT NULL DEFAULT 'OPEN',
    opened_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at   TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ
);

-- Attendance
CREATE TABLE attendance (
    id                  SERIAL PRIMARY KEY,
    event_id            INTEGER REFERENCES events(id) NOT NULL,
    user_id             INTEGER REFERENCES users(id) NOT NULL,
    card_id             INTEGER REFERENCES nfc_cards(id),
    checkin_session_id  INTEGER REFERENCES checkin_sessions(id),
    method              attendance_method NOT NULL,
    recorded_by         INTEGER REFERENCES users(id),
    checked_in_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)  -- one check-in per user per event
);

-- Audit Logs
CREATE TABLE audit_logs (
    id          SERIAL PRIMARY KEY,
    actor_id    INTEGER REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   INTEGER,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_email_verification_tokens_hash ON email_verification_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_nfc_cards_user_id ON nfc_cards(user_id);
CREATE INDEX idx_nfc_cards_token_hash ON nfc_cards(token_hash);
CREATE INDEX idx_nfc_cards_status ON nfc_cards(status);
CREATE INDEX idx_attendance_event_id ON attendance(event_id);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_checkin_sessions_event_id ON checkin_sessions(event_id);
