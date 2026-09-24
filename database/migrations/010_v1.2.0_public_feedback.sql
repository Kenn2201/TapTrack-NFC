-- ============================================================================
-- TapTrack NFC v1.2.0 — Public Feedback
-- Allows anonymous public feedback while preserving authenticated feedback.
-- Additive and non-destructive.
-- ============================================================================

ALTER TABLE feedback
  ALTER COLUMN user_id DROP NOT NULL;
