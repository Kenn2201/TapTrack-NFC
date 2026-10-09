# TapTrack NFC v1.2 RC — Render deployment recovery

## Verified finding (2026-10-10)

Render successfully BUILT `62b58a0` and `fb63576`, but those deployments
FAILED to start (process exited with code 1). The last successful Render
deployment shown in service history is `af7fb88`.

A **read-only Neon query** confirmed that user `1` has two ACTIVE NFC cards:
`id=2 / NFC-002` and `id=4 / NFC-004`. Both were confirmed disposable test
cards. This **violates migration 009**, which deliberately blocks database
migrations when one account has more than one ACTIVE card. This is a proven
migration blocker, although the original expired Render logs cannot exclude
other startup errors.

Do not silently auto-modify credentials or change the protected `NFC-001`.

## Recovery order

1. Verify you are in the correct production Neon database; take a restore
   point/backup if available. Keep the existing `DATABASE_URL` and
   `CARD_TOKEN_PEPPER`; never reset production or rerun migration 007.
2. Preferred: Use **TapTrack Admin → NFC Cards** to DISABLE `NFC-002`, recording
   the reason `Duplicate test card cleanup for v1.2 migration`. Keep `NFC-004`
   ACTIVE. Using the app captures the normal actor audit history.
3. If the Admin action is unavailable, have an authorized operator carefully
   review and execute the **manual-only** file
   [`ops/sql/2026-10-10-disable-nfc-002.sql`](../ops/sql/2026-10-10-disable-nfc-002.sql)
   in Neon's SQL Editor. The transaction checks card IDs, labels, ownership
   and expected state **before changing one row**, records an audit entry
   (with null actor rather than falsely attributing an action), and
   preserves card history. It is NOT run by GitHub Actions or Render.
4. Confirm the final state with this read-only query:

   ```sql
   SELECT id, card_label, user_id, status
   FROM nfc_cards WHERE id IN (2, 4) ORDER BY id;

   SELECT user_id, COUNT(*) AS active_cards
   FROM nfc_cards WHERE user_id IS NOT NULL AND status = 'ACTIVE'
   GROUP BY user_id HAVING COUNT(*) > 1;
   ```

   Expect `NFC-002 = DISABLED`, `NFC-004 = ACTIVE`, and **zero rows**
   in the second result. NFC-001 must remain unchanged.
5. Once code is approved and CI is green, merge the `kenn/develop → master`
   PR. Render deploys `master` automatically. Review fresh build AND
   startup logs. A successful build alone is not sufficient.
6. Verify `https://api.nfc.kenncode.me/health` and regression-test admin,
   authentication, NFC URL and Web NFC workflows. Human physical QA is still
   the final release gate; remain `v1.2.0 RC` until accepted.

## New startup diagnostic

The backend performs a **read-only** duplicate ACTIVE-card check before
Drizzle migration. If duplicates remain, Render's new startup logs show
`NFC_CARD_DUPLICATE_ACTIVE` with the conflicting card labels. It never
auto-disables, deletes, rotates, or rewrites a physical NFC credential.

The same migration is independently checked by GitHub CI against a test
PostgreSQL database. Do not point migration-reset QA tools at production.
