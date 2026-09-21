-- TapTrack NFC v0.7.0 BETA: complete lifecycle metadata and replacement relation.
-- Additive only; issued cards and attendance history are preserved.
ALTER TABLE nfc_cards ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE nfc_cards ADD COLUMN IF NOT EXISTS revoked_by INTEGER REFERENCES users(id);
ALTER TABLE nfc_cards ADD COLUMN IF NOT EXISTS revocation_reason VARCHAR(200);
ALTER TABLE nfc_cards ADD COLUMN IF NOT EXISTS replaced_by_card_id INTEGER REFERENCES nfc_cards(id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_replacement ON nfc_cards(replaced_by_card_id);
