-- ============================================================================
-- TapTrack NFC — Migration 001: v0.2.0 Authentication & User Tokens
-- Target: PostgreSQL (Local / Neon Serverless)
-- ============================================================================

-- 1. Add email_verified_at column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 2. Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes for performance and security lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
