-- ============================================================================
-- TapTrack NFC — Migration 002: v0.3.0 NFC Provisioning & Card Lifecycle
-- Target: PostgreSQL (Local / Neon Serverless)
-- ============================================================================

-- 1. Ensure card_status enum exists and contains all required lifecycle states
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_status') THEN
        CREATE TYPE card_status AS ENUM (
            'UNASSIGNED',
            'ACTIVE',
            'REVOKED',
            'LOST',
            'REPLACED',
            'DISABLED'
        );
    END IF;
END$$;

-- Ensure individual enum values exist if card_status was created in a previous revision
ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'UNASSIGNED';
ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'REVOKED';
ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'LOST';
ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'REPLACED';
ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'DISABLED';

-- 2. Create nfc_cards table if it doesn't already exist
CREATE TABLE IF NOT EXISTS nfc_cards (
    id                  SERIAL PRIMARY KEY,
    card_label          VARCHAR(50) UNIQUE NOT NULL,       -- e.g. NFC-001
    user_id             INTEGER REFERENCES users(id),
    token_hash          VARCHAR(64) UNIQUE NOT NULL,       -- HMAC-SHA256 derived credential hash
    status              card_status NOT NULL DEFAULT 'UNASSIGNED',
    issued_at           TIMESTAMPTZ,
    issued_by           INTEGER REFERENCES users(id),
    activated_at        TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ,
    revoked_by          INTEGER REFERENCES users(id),
    revocation_reason   VARCHAR(100),
    replaced_by_card_id INTEGER REFERENCES nfc_cards(id),
    last_used_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Non-destructively add columns if table already existed without them
ALTER TABLE nfc_cards ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE nfc_cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 4. Create performance and lookup indexes
CREATE INDEX IF NOT EXISTS idx_nfc_cards_user_id ON nfc_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_token_hash ON nfc_cards(token_hash);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_status ON nfc_cards(status);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_card_label ON nfc_cards(card_label);
