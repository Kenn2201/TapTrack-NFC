import { describe, expect, it, vi } from 'vitest';
import { assertNoDuplicateActiveCards } from '../src/db/duplicateCardPreflight.js';

describe('read-only duplicate ACTIVE card migration preflight', () => {
  it('allows migration to proceed when each user has at most one active card', async () => {
    const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    await expect(assertNoDuplicateActiveCards(client)).resolves.toBeUndefined();
    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls[0][0]).toContain("HAVING COUNT(*) > 1");
    expect(client.query.mock.calls[0][0]).not.toMatch(/\b(?:UPDATE|INSERT|DELETE|TRUNCATE)\b/i);
  });

  it('stops with the actual duplicate card labels and does not write data', async () => {
    const client = { query: vi.fn().mockResolvedValue({ rows: [
      { user_id: 1, active_cards: 2, card_labels: ['NFC-002', 'NFC-004'] },
    ] }) };
    await expect(assertNoDuplicateActiveCards(client)).rejects.toMatchObject({
      code: 'NFC_CARD_DUPLICATE_ACTIVE',
      message: expect.stringContaining('NFC-002, NFC-004'),
    });
    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls[0][0]).toContain("status = 'ACTIVE'");
  });
});
