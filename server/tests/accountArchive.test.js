import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userRepository: {
    updateStatus: vi.fn(),
    revokeAllSessions: vi.fn(),
  },
  auditService: {
    log: vi.fn(),
  },
  authService: {
    register: vi.fn(),
    forgotPassword: vi.fn(),
  },
}));

vi.mock('../src/repositories/user.repository.js', () => ({ userRepository: mocks.userRepository }));
vi.mock('../src/services/audit.service.js', () => ({ auditService: mocks.auditService }));
vi.mock('../src/services/auth.service.js', async () => {
  const actual = await vi.importActual('../src/services/auth.service.js');
  return { ...actual, authService: { ...actual.authService, ...mocks.authService } };
});

const { authController } = await import('../src/controllers/auth.controller.js');

function response() {
  const res = {
    statusCode: 200,
    body: null,
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    status: vi.fn((code) => { res.statusCode = code; return res; }),
    json: vi.fn((body) => { res.body = body; return res; }),
  };
  return res;
}

describe('v1.2 account archive and auth bot defense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userRepository.updateStatus.mockResolvedValue({
      id: 7,
      email: 'user@example.com',
      first_name: 'Alex',
      last_name: 'Rivera',
      role: 'USER',
      status: 'DISABLED',
    });
    mocks.auditService.log.mockResolvedValue({});
  });

  it('archives a non-admin account by disabling access and preserving history', async () => {
    const req = { user: { id: 7, role: 'USER' }, validated: { confirmation: 'ARCHIVE' } };
    const res = response();
    const next = vi.fn();

    await authController.archiveAccount(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(mocks.userRepository.updateStatus).toHaveBeenCalledWith(7, 'DISABLED');
    expect(mocks.auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 7,
      action: 'ACCOUNT_ARCHIVED',
      entityType: 'USER',
      entityId: 7,
    }));
    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.body.message).toMatch(/preserved/i);
    expect(res.body.user.status).toBe('DISABLED');
  });

  it('blocks administrator self-archive to avoid administrative lockout', async () => {
    const req = { user: { id: 1, role: 'ADMIN' }, validated: { confirmation: 'ARCHIVE' } };
    const res = response();
    const next = vi.fn();

    await authController.archiveAccount(req, res, next);

    expect(mocks.userRepository.updateStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({
      code: 'ADMIN_SELF_ARCHIVE_BLOCKED',
      status: 409,
    });
  });

  it('silently absorbs a filled registration honeypot without creating an account', async () => {
    const req = {
      validated: {
        email: 'bot@example.com',
        password: 'Password123!',
        firstName: 'Bot',
        lastName: 'Trap',
        website: 'https://spam.invalid',
      },
    };
    const res = response();
    const next = vi.fn();

    await authController.register(req, res, next);

    expect(mocks.authService.register).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toBeNull();
  });

  it('returns the generic forgot-password response for a filled honeypot', async () => {
    const req = { validated: { email: 'bot@example.com', website: 'spam' } };
    const res = response();
    const next = vi.fn();

    await authController.forgotPassword(req, res, next);

    expect(mocks.authService.forgotPassword).not.toHaveBeenCalled();
    expect(res.body.message).toMatch(/If an account exists/i);
  });
});
