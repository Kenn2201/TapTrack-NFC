import { beforeEach, describe, expect, it, vi } from 'vitest';

const repos = vi.hoisted(() => ({
  requests: {
    findOpenByUserId: vi.fn(),
    create: vi.fn(),
    listByUser: vi.fn(),
    listAll: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
  },
  cards: {
    findLatestByUserId: vi.fn(),
  },
}));

vi.mock('../src/repositories/cardRequest.repository.js', () => ({ cardRequestRepository: repos.requests }));
vi.mock('../src/repositories/nfcCard.repository.js', () => ({ nfcCardRepository: repos.cards }));
vi.mock('../src/services/audit.service.js', () => ({ auditService: { log: vi.fn().mockResolvedValue({}) } }));

const { cardRequestService } = await import('../src/services/cardRequest.service.js');

describe('v1.2 NFC setup/replacement request queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repos.requests.findOpenByUserId.mockResolvedValue(null);
    repos.requests.create.mockImplementation(async (data) => ({ id: 1, status: 'PENDING', ...data }));
    repos.requests.listByUser.mockResolvedValue([]);
    repos.requests.listAll.mockResolvedValue([]);
    repos.requests.findById.mockResolvedValue({ id: 1, userId: 7, requestType: 'SETUP', status: 'PENDING' });
    repos.requests.updateStatus.mockImplementation(async (id, data) => ({ id, userId: 7, requestType: 'SETUP', ...data }));
    repos.cards.findLatestByUserId.mockResolvedValue(null);
  });

  it('creates SETUP when user has no card history', async () => {
    await expect(cardRequestService.createForUser({
      userId: 7,
      requestType: 'SETUP',
      note: 'First card please',
    })).resolves.toMatchObject({ requestType: 'SETUP', status: 'PENDING' });
  });

  it('requires REPLACEMENT when card history already exists', async () => {
    repos.cards.findLatestByUserId.mockResolvedValue({ id: 4, cardLabel: 'NFC-004', status: 'LOST' });
    await expect(cardRequestService.createForUser({
      userId: 7,
      requestType: 'SETUP',
    })).rejects.toMatchObject({ code: 'CARD_REQUEST_TYPE_MISMATCH', status: 409 });
  });

  it('prevents multiple open requests for one user', async () => {
    repos.requests.findOpenByUserId.mockResolvedValue({ id: 9, status: 'IN_REVIEW' });
    await expect(cardRequestService.createForUser({
      userId: 7,
      requestType: 'SETUP',
    })).rejects.toMatchObject({ code: 'CARD_REQUEST_EXISTS', status: 409 });
  });

  it('keeps admin queue restricted to ADMIN', async () => {
    await expect(cardRequestService.listAll({}, { id: 2, role: 'OPERATOR' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });

  it('lets ADMIN advance request status without exposing credentials', async () => {
    await expect(cardRequestService.updateStatus({
      id: 1,
      status: 'FULFILLED',
      adminNote: 'Provisioned physical card',
      actor: { id: 1, role: 'ADMIN' },
    })).resolves.toMatchObject({ id: 1, status: 'FULFILLED' });
  });
});
