import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  repository: {
    create: vi.fn(),
    list: vi.fn(),
    updateStatus: vi.fn(),
  },
  audit: {
    log: vi.fn(),
  },
}));

vi.mock('../src/repositories/feedback.repository.js', () => ({ feedbackRepository: mocks.repository }));
vi.mock('../src/services/audit.service.js', () => ({ auditService: mocks.audit }));

const { feedbackService } = await import('../src/services/feedback.service.js');

describe('v1.2 public feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.repository.create.mockImplementation(async (data) => ({
      id: 1,
      status: 'NEW',
      ...data,
    }));
    mocks.audit.log.mockResolvedValue({});
  });

  it('allows anonymous feedback only through the explicit public flow', async () => {
    const result = await feedbackService.submit({
      actor: null,
      allowAnonymous: true,
      category: 'BUG',
      rating: 3,
      message: 'Public report',
      page: '/feedback/public',
      reproduction: null,
    });

    expect(result.userId).toBeNull();
    expect(mocks.repository.create).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
    expect(mocks.audit.log).not.toHaveBeenCalled();
  });

  it('rejects anonymous submission when the public flag is absent', async () => {
    await expect(feedbackService.submit({
      actor: null,
      category: 'OTHER',
      rating: 3,
      message: 'Should fail',
    })).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  it('keeps authenticated feedback associated with the submitting user and audited', async () => {
    await feedbackService.submit({
      actor: { id: 9, role: 'USER' },
      category: 'UX',
      rating: 4,
      message: 'Signed-in feedback',
    });

    expect(mocks.repository.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 9 }));
    expect(mocks.audit.log).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 9,
      action: 'FEEDBACK_SUBMITTED',
    }));
  });
});
