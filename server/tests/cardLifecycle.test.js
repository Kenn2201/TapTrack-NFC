import { beforeEach, describe, expect, it, vi } from 'vitest';
process.env.CARD_TOKEN_PEPPER = 'test-card-pepper-at-least-32-characters-long';
process.env.NFC_DOMAIN = 'https://nfc.kenncode.me';

const repo = vi.hoisted(() => ({ findById: vi.fn(), updateLifecycle: vi.fn(), findByCardLabel: vi.fn(), replaceCard: vi.fn() }));
vi.mock('../src/repositories/nfcCard.repository.js', () => ({ nfcCardRepository: repo }));
vi.mock('../src/services/audit.service.js', () => ({ auditService: { log: vi.fn().mockResolvedValue({}) } }));
const { cardLifecycleService, CARD_TRANSITIONS } = await import('../src/services/cardLifecycle.service.js');
const admin = { id: 1, role: 'ADMIN' };
const operator = { id: 2, role: 'OPERATOR' };

describe('v0.7 centralized card lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findById.mockResolvedValue({ id: 10, cardLabel: 'NFC-001', userId: 30, status: 'ACTIVE' });
    repo.updateLifecycle.mockImplementation(async (id, data) => ({ id, cardLabel: 'NFC-001', ...data }));
    repo.findByCardLabel.mockResolvedValue(null);
    repo.replaceCard.mockImplementation(async (data) => ({ oldCard: { id: data.oldCardId, status: 'REPLACED', replacedByCardId: 11 }, newCard: { id: 11, cardLabel: data.cardLabel, status: 'UNASSIGNED', userId: data.userId } }));
  });
  for (const targetStatus of CARD_TRANSITIONS.ACTIVE) {
    it(`allows ACTIVE → ${targetStatus}`, async () => expect(cardLifecycleService.transition({ cardId: 10, targetStatus, actor: admin, reason: 'Administrative reason' })).resolves.toMatchObject({ status: targetStatus }));
  }
  it('allows the documented DISABLED → ACTIVE recovery', async () => { repo.findById.mockResolvedValue({ id: 10, status: 'DISABLED' }); await expect(cardLifecycleService.transition({ cardId: 10, targetStatus: 'ACTIVE', actor: admin })).resolves.toMatchObject({ status: 'ACTIVE' }); });
  it('rejects invalid transitions', async () => expect(cardLifecycleService.transition({ cardId: 10, targetStatus: 'REPLACED', actor: admin })).rejects.toMatchObject({ code: 'INVALID_CARD_TRANSITION' }));
  it('denies OPERATOR lifecycle administration', async () => expect(cardLifecycleService.transition({ cardId: 10, targetStatus: 'LOST', actor: operator, reason: 'Lost' })).rejects.toMatchObject({ code: 'FORBIDDEN' }));
  it('denies USER lifecycle administration', async () => expect(cardLifecycleService.transition({ cardId: 10, targetStatus: 'LOST', actor: { id: 3, role: 'USER' }, reason: 'Lost' })).rejects.toMatchObject({ code: 'FORBIDDEN' }));
  it('replaces LOST card, preserves old row relation, and assigns the same user', async () => {
    repo.findById.mockResolvedValue({ id: 10, cardLabel: 'NFC-001', userId: 30, status: 'LOST' });
    const result = await cardLifecycleService.replace({ cardId: 10, newCardLabel: 'NFC-002', actor: admin, reason: 'Lost' });
    expect(result.oldCard).toMatchObject({ id: 10, status: 'REPLACED', replacedByCardId: 11 });
    expect(result.newCard).toMatchObject({ userId: 30, status: 'UNASSIGNED' });
    expect(result.writeUrl).toContain('/t#');
  });
  it('generates a different credential for every replacement', async () => {
    repo.findById.mockResolvedValue({ id: 10, cardLabel: 'NFC-001', userId: 30, status: 'LOST' });
    const one = await cardLifecycleService.replace({ cardId: 10, newCardLabel: 'NFC-002', actor: admin });
    const two = await cardLifecycleService.replace({ cardId: 10, newCardLabel: 'NFC-003', actor: admin });
    expect(one.rawToken).not.toBe(two.rawToken);
  });
});
