/**
 * Read-only guard for legacy duplicate ACTIVE cards before Drizzle migrations.
 * Never change card lifecycle data during deployment.
 */
export async function assertNoDuplicateActiveCards(client) {
  const { rows } = await client.query(`
    SELECT user_id, COUNT(*)::int AS active_cards,
      ARRAY_AGG(card_label ORDER BY id) AS card_labels
    FROM nfc_cards
    WHERE user_id IS NOT NULL AND status = 'ACTIVE'
    GROUP BY user_id
    HAVING COUNT(*) > 1
    ORDER BY user_id
    LIMIT 10;
  `);

  if (rows.length === 0) return;

  const details = rows.map((row) =>
    `user ${row.user_id}: ${row.active_cards} ACTIVE cards (${row.card_labels.join(', ')})`
  ).join('; ');

  const error = new Error(
    `NFC_CARD_DUPLICATE_ACTIVE: Database migration blocked by ${details}. ` +
    'Resolve duplicate TEST cards explicitly through Admin card management ' +
    'or the guarded manual Neon recovery procedure in docs/taptrack-render-recovery.md. ' +
    'Do not reset the database, auto-disable cards, or change NFC-001.'
  );
  error.code = 'NFC_CARD_DUPLICATE_ACTIVE';
  throw error;
}
