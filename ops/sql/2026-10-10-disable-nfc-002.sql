-- TapTrack NFC v1.2 RC: MANUAL, ONE-TIME data recovery (NOT a Drizzle migration).
-- Only use in the known production Neon database AFTER the operator confirms
-- that NFC-002 and NFC-004 are disposable test cards for user 1.
-- Keep NFC-004 ACTIVE. Disable ONLY NFC-002. Never touch NFC-001.
-- Do not add this script to any automatic deployment/startup command.
-- Safest alternative: disable NFC-002 from TapTrack Admin > NFC Cards.
-- Read docs/taptrack-render-recovery.md first. Take a restore point/backup.

BEGIN;
SET LOCAL lock_timeout = '5s';

DO $$
DECLARE
  active_for_user INTEGER;
BEGIN
  -- Lock the identified user and two test-card rows before verifying.
  PERFORM 1 FROM users WHERE id = 1 FOR UPDATE;
  PERFORM 1 FROM nfc_cards WHERE id IN (2, 4) FOR UPDATE;

  SELECT COUNT(*)::integer INTO active_for_user
  FROM nfc_cards WHERE user_id = 1 AND status = 'ACTIVE';

  IF active_for_user <> 2
     OR NOT EXISTS (
       SELECT 1 FROM nfc_cards
       WHERE id = 2 AND card_label = 'NFC-002'
         AND user_id = 1 AND status = 'ACTIVE'
     )
     OR NOT EXISTS (
       SELECT 1 FROM nfc_cards
       WHERE id = 4 AND card_label = 'NFC-004'
         AND user_id = 1 AND status = 'ACTIVE'
     )
  THEN
    RAISE EXCEPTION 'Card identities or statuses have changed; no recovery performed.';
  END IF;

  -- Refuse to hide any unrelated duplicate-card problems.
  IF EXISTS (
    SELECT user_id FROM nfc_cards
    WHERE user_id IS NOT NULL AND status = 'ACTIVE' AND user_id <> 1
    GROUP BY user_id HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Other users have duplicate ACTIVE cards; no recovery performed.';
  END IF;

  UPDATE nfc_cards SET
    status = 'DISABLED',
    revoked_at = NOW(),
    revoked_by = NULL,  -- No fabricated application actor for manual SQL.
    revocation_reason = 'Duplicate test card cleanup for v1.2 migration',
    updated_at = NOW()
  WHERE id = 2 AND card_label = 'NFC-002'
    AND user_id = 1 AND status = 'ACTIVE';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expected NFC-002 update did not occur; no recovery performed.';
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    NULL,
    'CARD_DISABLED',
    'NFC_CARD',
    2,
    jsonb_build_object(
      'from', 'ACTIVE',
      'to', 'DISABLED',
      'reason', 'Duplicate test card cleanup for v1.2 migration',
      'source', 'manual_neon_recovery',
      'retainedCardLabel', 'NFC-004'
    )
  );
END $$;

-- Review expected: NFC-002 DISABLED, NFC-004 ACTIVE.
SELECT id, card_label, user_id, status
FROM nfc_cards WHERE id IN (2, 4) ORDER BY id;

COMMIT;

-- If any statement reports an error, do not run COMMIT. Run ROLLBACK;
-- then investigate the changed preconditions before retrying.
