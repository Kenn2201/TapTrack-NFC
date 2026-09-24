-- ============================================================================
-- TapTrack NFC v1.2.0 — NFC Setup / Replacement Request Queue
-- Additive workflow for card-holder requests. No credentials or raw NFC tokens.
-- Safe to run repeatedly. No destructive operations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS card_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  card_id BIGINT NULL REFERENCES nfc_cards(id) ON DELETE SET NULL,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('SETUP', 'REPLACEMENT')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'IN_REVIEW', 'FULFILLED', 'REJECTED')),
  note TEXT NULL,
  admin_note TEXT NULL,
  handled_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  handled_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_requests_user_created
  ON card_requests(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_requests_status_created
  ON card_requests(status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_card_requests_open_per_user
  ON card_requests(user_id)
  WHERE status IN ('PENDING', 'IN_REVIEW');


-- One current ACTIVE card per user.
-- Do not silently alter existing lifecycle history. If legacy duplicate ACTIVE
-- cards exist, stop the migration and resolve them explicitly before retrying.
DO $$
BEGIN
  IF EXISTS (
    SELECT user_id
    FROM nfc_cards
    WHERE user_id IS NOT NULL AND status = 'ACTIVE'
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one active NFC card per user: duplicate ACTIVE cards exist. Resolve lifecycle state manually before retrying migration 009.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_nfc_cards_one_active_per_user
  ON nfc_cards(user_id)
  WHERE user_id IS NOT NULL AND status = 'ACTIVE';
