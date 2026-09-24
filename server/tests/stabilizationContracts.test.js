import { describe, expect, it } from 'vitest';
import {
  changePasswordSchema,
  createEventSchema,
  emailBroadcastSchema,
  emailSendSchema,
  maintenanceSchema,
} from '../src/validators/schemas.js';

describe('v1.2 stabilization request contracts', () => {
  it('accepts direct email with a plain-text body', () => {
    const parsed = emailSendSchema.parse({
      to: 'user@example.com',
      subject: 'TapTrack update',
      text: 'Your TapTrack account has been updated.',
    });
    expect(parsed.to).toBe('user@example.com');
    expect(parsed.text).toContain('TapTrack');
  });

  it('accepts direct email with an HTML body', () => {
    const parsed = emailSendSchema.parse({
      to: 'user@example.com',
      subject: 'TapTrack update',
      html: '<p>Your TapTrack account has been updated.</p>',
    });
    expect(parsed.html).toContain('<p>');
  });

  it('rejects direct email without a message body', () => {
    const result = emailSendSchema.safeParse({
      to: 'user@example.com',
      subject: 'Missing body',
    });
    expect(result.success).toBe(false);
  });

  it('requires explicit broadcast confirmation', () => {
    const rejected = emailBroadcastSchema.safeParse({
      subject: 'Announcement',
      text: 'Maintenance later today.',
      confirmBroadcast: false,
    });
    expect(rejected.success).toBe(false);

    const accepted = emailBroadcastSchema.safeParse({
      subject: 'Announcement',
      text: 'Maintenance later today.',
      confirmBroadcast: true,
    });
    expect(accepted.success).toBe(true);
  });

  it('accepts maintenance fields used by the server contract', () => {
    const parsed = maintenanceSchema.parse({
      enabled: true,
      message: 'TapTrack is undergoing scheduled maintenance.',
    });
    expect(parsed.enabled).toBe(true);
  });

  it('preserves optional event location during validation', () => {
    const parsed = createEventSchema.parse({
      name: 'TapTrack Demo',
      description: 'Physical NFC attendance demonstration.',
      location: 'Main Hall',
      startAt: '2026-09-25T01:00:00.000Z',
      endAt: '2026-09-25T02:00:00.000Z',
      status: 'DRAFT',
    });
    expect(parsed.location).toBe('Main Hall');
  });

  it('accepts PUBLIC and INVITE_ONLY event visibility values', () => {
    const base = {
      name: 'Visibility Test',
      startAt: '2026-09-25T01:00:00.000Z',
      endAt: '2026-09-25T02:00:00.000Z',
      status: 'DRAFT',
    };

    expect(createEventSchema.parse({ ...base, visibility: 'PUBLIC' }).visibility).toBe('PUBLIC');
    expect(createEventSchema.parse({ ...base, visibility: 'INVITE_ONLY' }).visibility).toBe('INVITE_ONLY');
    expect(createEventSchema.safeParse({ ...base, visibility: 'PRIVATE' }).success).toBe(false);
  });

  it('requires matching password confirmation', () => {
    const rejected = changePasswordSchema.safeParse({
      currentPassword: 'current-password',
      newPassword: 'new-password-123',
      confirmPassword: 'different-password',
    });
    expect(rejected.success).toBe(false);

    const accepted = changePasswordSchema.safeParse({
      currentPassword: 'current-password',
      newPassword: 'new-password-123',
      confirmPassword: 'new-password-123',
    });
    expect(accepted.success).toBe(true);
  });
});
