import { describe, expect, it, vi } from 'vitest';

const auditRepo = vi.hoisted(() => ({ create: vi.fn(async (value) => value), list: vi.fn(async () => []) }));
vi.mock('../src/repositories/audit.repository.js', () => ({ auditRepository: auditRepo }));
const attendanceRepo = vi.hoisted(() => ({ listByUser: vi.fn() }));
vi.mock('../src/repositories/attendance.repository.js', () => ({ attendanceRepository: attendanceRepo }));

const { auditService, sanitizeAuditMetadata } = await import('../src/services/audit.service.js');
const { calculateActivityPulse, activityPulseService } = await import('../src/services/activityPulse.service.js');
const { requireTrustedOrigin } = await import('../src/middleware/originGuard.js');
const { requireRole } = await import('../src/middleware/roles.js');

describe('v0.8 activity pulse and audit hardening', () => {
  it('calculates total check-ins and distinct events', () => {
    const result = calculateActivityPulse([{ eventId: 1, recordedAt: '2026-09-21T00:00:00Z' }, { eventId: 1, recordedAt: '2026-09-22T00:00:00Z' }, { eventId: 2, recordedAt: '2026-09-14T00:00:00Z' }], new Date('2026-09-23T00:00:00Z'));
    expect(result).toMatchObject({ totalCheckIns: 3, eventsAttended: 2, attendanceRate: null, attendanceRateLabel: 'N/A', currentStreak: 2 });
  });
  it('returns zero streak when attendance is not current', () => expect(calculateActivityPulse([{ eventId: 1, recordedAt: '2026-01-01T00:00:00Z' }], new Date('2026-09-23T00:00:00Z')).currentStreak).toBe(0));
  it('loads pulse records only for the requested user', async () => { attendanceRepo.listByUser.mockResolvedValue([]); await activityPulseService.getForUser(42); expect(attendanceRepo.listByUser).toHaveBeenCalledWith(42); });
  it('recursively removes secrets from audit metadata', () => expect(sanitizeAuditMetadata({ reason: 'lost', token: 'raw', nested: { passwordHash: 'x', safe: true }, cookies: ['x'] })).toEqual({ reason: 'lost', nested: { safe: true } }));
  it('serializes a sanitized audit record', async () => { await auditService.log({ actorId: 1, action: 'TEST', entityType: 'CARD', entityId: 2, metadata: { token_hash: 'never', status: 'LOST' } }); expect(auditRepo.create).toHaveBeenCalledWith(expect.objectContaining({ metadata: { status: 'LOST' } })); });
  it('offers no audit mutation method', () => { expect(auditService.update).toBeUndefined(); expect(auditService.delete).toBeUndefined(); });
  it('rejects untrusted origins for state changes', () => { const status = vi.fn().mockReturnThis(); const json = vi.fn(); requireTrustedOrigin({ method: 'POST', get: () => 'https://attacker.example' }, { status, json }, vi.fn()); expect(status).toHaveBeenCalledWith(403); });
  it('allows only ADMIN through the audit authorization policy', () => { const guard = requireRole('ADMIN'); const status = vi.fn().mockReturnThis(); const json = vi.fn(); guard({ user: { role: 'OPERATOR' } }, { status, json }, vi.fn()); expect(status).toHaveBeenCalledWith(403); });
});
