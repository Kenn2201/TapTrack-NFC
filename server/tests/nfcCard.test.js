import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { nfcCredentialService } from '../src/services/nfcCredential.service.js';

// Configure test environment variables before app import
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long-secure-taptrack';
process.env.CARD_TOKEN_PEPPER = 'test-card-pepper-at-least-32-chars-long-secure-taptrack';
process.env.NFC_DOMAIN = 'https://nfc.kenncode.me';
process.env.PORT = '3001';

// In-memory tables for tests
let usersTable = [];
let cardsTable = [];
let nextUserId = 1;
let nextCardId = 1;

// Mock db pool
vi.mock('../src/repositories/db.js', () => {
  return {
    default: {
      query: vi.fn(async (text, params = []) => {
        const q = text.replace(/\s+/g, ' ').trim();

        // ─── USERS QUERIES ──────────────────────────────────────────────────
        if (q.includes('FROM users') && q.includes('WHERE id = $1')) {
          const id = params[0];
          const user = usersTable.find((u) => u.id === id);
          return { rows: user ? [{ ...user }] : [] };
        }

        if (q.includes('FROM users') && q.includes('LOWER(email) = LOWER($1)')) {
          const email = params[0].toLowerCase();
          const user = usersTable.find((u) => u.email.toLowerCase() === email);
          return { rows: user ? [{ ...user }] : [] };
        }

        // ─── NFC CARDS QUERIES ──────────────────────────────────────────────
        if (q.includes('FROM nfc_cards') && q.includes('UPPER(c.card_label) = UPPER($1)')) {
          const label = params[0].toUpperCase();
          const card = cardsTable.find((c) => c.card_label.toUpperCase() === label);
          if (!card) return { rows: [] };
          const user = usersTable.find((u) => u.id === card.user_id);
          return {
            rows: [{
              ...card,
              user_email: user?.email,
              user_first_name: user?.first_name,
              user_last_name: user?.last_name,
              user_role: user?.role,
              user_status: user?.status,
            }],
          };
        }

        if (q.includes('FROM nfc_cards') && q.includes('WHERE c.id = $1')) {
          const id = params[0];
          const card = cardsTable.find((c) => c.id === id);
          if (!card) return { rows: [] };
          const user = usersTable.find((u) => u.id === card.user_id);
          const issuer = usersTable.find((u) => u.id === card.issued_by);
          return {
            rows: [{
              ...card,
              user_email: user?.email,
              user_first_name: user?.first_name,
              user_last_name: user?.last_name,
              user_role: user?.role,
              user_status: user?.status,
              issuer_email: issuer?.email,
              issuer_first_name: issuer?.first_name,
              issuer_last_name: issuer?.last_name,
            }],
          };
        }

        if (q.includes('FROM nfc_cards') && q.includes('ORDER BY c.id ASC')) {
          const rows = cardsTable.map((c) => {
            const user = usersTable.find((u) => u.id === c.user_id);
            return {
              ...c,
              user_email: user?.email,
              user_first_name: user?.first_name,
              user_last_name: user?.last_name,
              user_role: user?.role,
              user_status: user?.status,
            };
          });
          return { rows };
        }

        if (q.startsWith('INSERT INTO nfc_cards')) {
          const [card_label, user_id, token_hash, status, issued_by, issued_at] = params;
          const newCard = {
            id: nextCardId++,
            card_label,
            user_id: user_id || null,
            token_hash,
            status: status || 'UNASSIGNED',
            issued_by: issued_by || null,
            issued_at: issued_at || new Date().toISOString(),
            activated_at: null,
            revoked_at: null,
            revoked_by: null,
            revocation_reason: null,
            replaced_by_card_id: null,
            last_used_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          cardsTable.push(newCard);
          return { rows: [{ ...newCard }] };
        }

        // ─── LIFECYCLE UPDATE (PATCH .../lifecycle) ─────────────────────────
        if (q.includes('UPDATE nfc_cards') && q.includes('CASE WHEN $1 IN')) {
          const [status, actorId, reason, id] = params;
          // Emulate an older/partially migrated PostgreSQL enum/check schema.
          if (reason === 'simulate lifecycle schema mismatch') {
            const err = new Error('invalid input value for enum card_status');
            err.code = '22P02';
            throw err;
          }

          // Emulate PostgreSQL VARCHAR(100) overflow on revocation_reason
          if (typeof reason === 'string' && reason.length > 100) {
            const err = new Error('value too long for type character varying(100)');
            err.code = '22001';
            throw err;
          }
          const card = cardsTable.find((c) => c.id === id);
          if (card) {
            card.status = status;
            if (['LOST', 'REVOKED', 'DISABLED'].includes(status)) {
              card.revoked_at = new Date().toISOString();
              card.revoked_by = actorId;
              card.revocation_reason = reason;
            }
            card.updated_at = new Date().toISOString();
            const user = usersTable.find((u) => u.id === card.user_id);
            return {
              rows: [{
                ...card,
                user_email: user?.email,
                user_first_name: user?.first_name,
                user_last_name: user?.last_name,
                user_role: user?.role,
                user_status: user?.status,
              }],
            };
          }
          return { rows: [] };
        }

        if (q.includes('UPDATE nfc_cards') && q.includes('status = $1')) {
          const [status, activatedAt, revokedAt, revokedBy, revocationReason, id] = params;
          const card = cardsTable.find((c) => c.id === id);
          if (card) {
            card.status = status;
            if (activatedAt) card.activated_at = activatedAt;
            if (revokedAt) card.revoked_at = revokedAt;
            if (revokedBy) card.revoked_by = revokedBy;
            if (revocationReason) card.revocation_reason = revocationReason;
            card.updated_at = new Date().toISOString();
            const user = usersTable.find((u) => u.id === card.user_id);
            return {
              rows: [{
                ...card,
                user_email: user?.email,
                user_first_name: user?.first_name,
                user_last_name: user?.last_name,
                user_role: user?.role,
                user_status: user?.status,
              }],
            };
          }
          return { rows: [] };
        }

        if (q.includes('UPDATE nfc_cards') && q.includes('user_id = $1')) {
          const [user_id, id] = params;
          const card = cardsTable.find((c) => c.id === id);
          if (card) {
            card.user_id = user_id;
            card.updated_at = new Date().toISOString();
            const user = usersTable.find((u) => u.id === card.user_id);
            return {
              rows: [{
                ...card,
                user_email: user?.email,
                user_first_name: user?.first_name,
                user_last_name: user?.last_name,
                user_role: user?.role,
                user_status: user?.status,
              }],
            };
          }
          return { rows: [] };
        }

        return { rows: [] };
      }),
    },
  };
});

// Import app after mocks
const { default: app } = await import('../src/app.js');

// Helper to create valid JWT cookie
function createSessionCookie(user) {
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return `taptrack_session=${token}; Path=/; HttpOnly`;
}

describe('TapTrack NFC v0.3.0 ALPHA — NFC Provisioning Test Suite', () => {
  let adminUser;
  let operatorUser;
  let regularUser;
  let disabledUser;

  beforeEach(() => {
    usersTable = [];
    cardsTable = [];
    nextUserId = 1;
    nextCardId = 1;

    adminUser = {
      id: nextUserId++,
      email: 'admin@example.com',
      password_hash: 'hash',
      first_name: 'Admin',
      last_name: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      email_verified_at: new Date().toISOString(),
    };
    operatorUser = {
      id: nextUserId++,
      email: 'operator@example.com',
      password_hash: 'hash',
      first_name: 'Operator',
      last_name: 'User',
      role: 'OPERATOR',
      status: 'ACTIVE',
      email_verified_at: new Date().toISOString(),
    };
    regularUser = {
      id: nextUserId++,
      email: 'member@example.com',
      password_hash: 'hash',
      first_name: 'Member',
      last_name: 'User',
      role: 'USER',
      status: 'ACTIVE',
      email_verified_at: new Date().toISOString(),
    };
    disabledUser = {
      id: nextUserId++,
      email: 'disabled@example.com',
      password_hash: 'hash',
      first_name: 'Disabled',
      last_name: 'User',
      role: 'USER',
      status: 'DISABLED',
      email_verified_at: new Date().toISOString(),
    };

    usersTable.push(adminUser, operatorUser, regularUser, disabledUser);
  });

  describe('RBAC & Access Control', () => {
    it('1. ADMIN can access card list and provisioning endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/cards')
        .set('Cookie', createSessionCookie(adminUser));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('cards');
      expect(Array.isArray(res.body.cards)).toBe(true);
    });

    it('2. regular USER cannot access card provisioning (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(regularUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });

      expect(res.status).toBe(403);
    });

    it('3. OPERATOR cannot access card provisioning in v0.3 (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(operatorUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });

      expect(res.status).toBe(403);
    });

    it('4. Unauthenticated request is rejected (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/admin/cards');

      expect(res.status).toBe(401);
    });
  });

  describe('Credential Generation & Security Architecture', () => {
    it('5. Generates high-entropy base64url random credential', () => {
      const raw1 = nfcCredentialService.generateRawCredential();
      const raw2 = nfcCredentialService.generateRawCredential();

      expect(typeof raw1).toBe('string');
      expect(raw1.length).toBeGreaterThanOrEqual(32);
      expect(raw1).not.toEqual(raw2);
      // Base64url character set check
      expect(/^[A-Za-z0-9_-]+$/.test(raw1)).toBe(true);
    });

    it('6. Physical write URL format begins strictly with https://nfc.kenncode.me/t#', () => {
      const raw = nfcCredentialService.generateRawCredential();
      const url = nfcCredentialService.buildWriteUrl(raw);

      expect(url).toBe(`https://nfc.kenncode.me/t#${raw}`);
      expect(url.startsWith('https://nfc.kenncode.me/t#')).toBe(true);
      expect(url).not.toContain('?token=');
    });

    it('7. Derives deterministic HMAC-SHA256 hash using CARD_TOKEN_PEPPER', () => {
      const raw = 'test-raw-token-value-12345';
      const hash1 = nfcCredentialService.deriveCredentialHash(raw);
      const hash2 = nfcCredentialService.deriveCredentialHash(raw);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // 256 bits in hex
      expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
    });

    it('8. Database receives only derived token hash; raw token is NEVER stored in database', async () => {
      const res = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });

      expect(res.status).toBe(201);
      const rawToken = res.body.rawToken;
      expect(rawToken).toBeDefined();

      // Inspect cardsTable internal mock
      const stored = cardsTable.find((c) => c.card_label === 'NFC-001');
      expect(stored).toBeDefined();
      expect(stored.token_hash).not.toBe(rawToken);
      expect(stored.token_hash).toBe(nfcCredentialService.deriveCredentialHash(rawToken));
      expect(JSON.stringify(stored)).not.toContain(rawToken);
    });

    it('9. token_hash is NEVER returned by list or detail endpoints', async () => {
      // Provision a card first
      const provRes = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });

      expect(provRes.status).toBe(201);
      const cardId = provRes.body.card.id;

      // GET /api/admin/cards (list)
      const listRes = await request(app)
        .get('/api/admin/cards')
        .set('Cookie', createSessionCookie(adminUser));

      expect(listRes.status).toBe(200);
      const listCard = listRes.body.cards.find((c) => c.id === cardId);
      expect(listCard).toBeDefined();
      expect(listCard.token_hash).toBeUndefined();
      expect(JSON.stringify(listRes.body)).not.toContain('token_hash');

      // GET /api/admin/cards/:id (detail)
      const detailRes = await request(app)
        .get(`/api/admin/cards/${cardId}`)
        .set('Cookie', createSessionCookie(adminUser));

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.card.token_hash).toBeUndefined();
      expect(JSON.stringify(detailRes.body)).not.toContain('token_hash');
    });

    it('10. Raw provisioning URL is returned ONLY during the initial provisioning call', async () => {
      const provRes = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });

      expect(provRes.status).toBe(201);
      expect(provRes.body.writeUrl).toBeDefined();
      expect(provRes.body.writeUrl.startsWith('https://nfc.kenncode.me/t#')).toBe(true);
      expect(provRes.body.rawToken).toBeDefined();

      // Subsequent GET must never return rawToken or writeUrl
      const detailRes = await request(app)
        .get(`/api/admin/cards/${provRes.body.card.id}`)
        .set('Cookie', createSessionCookie(adminUser));

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.card.rawToken).toBeUndefined();
      expect(detailRes.body.card.writeUrl).toBeUndefined();
      expect(JSON.stringify(detailRes.body)).not.toContain(provRes.body.rawToken);
    });
  });

  describe('Validation & Edge Cases', () => {
    it('11. Duplicate physical card label is rejected with 409 Conflict', async () => {
      // First card
      const res1 = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });
      expect(res1.status).toBe(201);

      // Duplicate card label
      const res2 = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });
      expect(res2.status).toBe(409);
      expect(res2.body.error).toMatch(/already exists/i);
    });

    it('12. Invalid assigned user is rejected with 404', async () => {
      const res = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-002', userId: 99999 });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    it('13. Disabled assigned user is rejected with 400', async () => {
      const res = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-003', userId: disabledUser.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/disabled/i);
    });
  });

  describe('Physical Write Confirmation & Card Activation', () => {
    it('14. Card starts as UNASSIGNED upon provisioning', async () => {
      const res = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });

      expect(res.status).toBe(201);
      expect(res.body.card.status).toBe('UNASSIGNED');
    });

    it('15. Activation without confirmWritten is rejected with 400', async () => {
      const provRes = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });

      const res = await request(app)
        .patch(`/api/admin/cards/${provRes.body.card.id}/activate`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ confirmWritten: false });

      expect(res.status).toBe(400);
    });

    it('16. Activation with confirmation transitions card to ACTIVE', async () => {
      const provRes = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });

      const cardId = provRes.body.card.id;

      const actRes = await request(app)
        .patch(`/api/admin/cards/${cardId}/activate`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ confirmWritten: true });

      expect(actRes.status).toBe(200);
      expect(actRes.body.card.status).toBe('ACTIVE');
      expect(actRes.body.card.activatedAt).toBeDefined();
    });

    it('17. Activating an already active card fails with 400', async () => {
      const provRes = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });

      const cardId = provRes.body.card.id;

      // First activation
      await request(app)
        .patch(`/api/admin/cards/${cardId}/activate`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ confirmWritten: true });

      // Second activation
      const actRes2 = await request(app)
        .patch(`/api/admin/cards/${cardId}/activate`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ confirmWritten: true });

      expect(actRes2.status).toBe(400);
      expect(actRes2.body.error).toMatch(/already active/i);
    });

    it('18. Provisioning records actor ID (issued_by)', async () => {
      const provRes = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: 'NFC-001', userId: regularUser.id });

      expect(provRes.status).toBe(201);
      expect(provRes.body.card.issuedBy).toBe(adminUser.id);
    });
  });

  describe('Card Lifecycle Transitions (PATCH /api/admin/cards/:id/lifecycle)', () => {
    const provisionAndActivate = async (label = 'NFC-001') => {
      const prov = await request(app)
        .post('/api/admin/cards/provision')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ cardLabel: label, userId: regularUser.id });
      const cardId = prov.body.card.id;
      await request(app)
        .patch(`/api/admin/cards/${cardId}/activate`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ confirmWritten: true });
      return cardId;
    };

    it('19. ACTIVE → LOST succeeds with a valid reason', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'LOST', reason: 'Card misplaced by member' });

      expect(res.status).toBe(200);
      expect(res.body.card.status).toBe('LOST');
      expect(res.body.card.revocationReason).toBe('Card misplaced by member');
      expect(res.body.card.token_hash).toBeUndefined();
    });

    it('20. ACTIVE → REVOKED succeeds with a valid reason', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'REVOKED', reason: 'Security revocation by admin' });

      expect(res.status).toBe(200);
      expect(res.body.card.status).toBe('REVOKED');
    });

    it('21. ACTIVE → DISABLED succeeds with a valid reason', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'DISABLED', reason: 'Temporarily disabled for maintenance' });

      expect(res.status).toBe(200);
      expect(res.body.card.status).toBe('DISABLED');
    });

    it('22. DISABLED → ACTIVE reactivation succeeds without a reason', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'DISABLED', reason: 'Maintenance window' });

      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.card.status).toBe('ACTIVE');
    });

    it('23. invalid lifecycle transition is rejected with 409', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'ACTIVE', reason: 'Cannot go ACTIVE to ACTIVE via invalid path' });

      // ACTIVE → ACTIVE is not an allowed transition
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('INVALID_CARD_TRANSITION');
    });

    it('24. reason shorter than 3 characters returns a friendly 400 (never raw Zod text)', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'LOST', reason: 'ab' });

      expect(res.status).toBe(400);
      const message = JSON.stringify(res.body);
      expect(message).not.toContain('String must contain at least 3 character');
      expect(message).toMatch(/at least 3 characters/i);
    });

    it('25. empty-string reason is rejected with a friendly 400 (never raw Zod text)', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'REVOKED', reason: '' });

      expect(res.status).toBe(400);
      const message = JSON.stringify(res.body);
      expect(message).not.toContain('String must contain at least 3 character');
      expect(message).toMatch(/reason/i);
    });

    it('26. reason longer than 100 characters is rejected with 400 (never a 500)', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'LOST', reason: 'R'.repeat(150) });

      expect(res.status).toBe(400);
      expect(res.status).not.toBe(500);
      expect(JSON.stringify(res.body)).toMatch(/100 characters/i);
    });

    it('27. missing reason for LOST returns friendly 400 REASON_REQUIRED', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'LOST' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/reason is required/i);
    });

    it('28. lifecycle schema mismatch returns a safe actionable 503 instead of generic 500', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'LOST', reason: 'simulate lifecycle schema mismatch' });

      expect(res.status).toBe(503);
      expect(res.body.code).toBe('CARD_LIFECYCLE_SCHEMA_MISMATCH');
      expect(res.body.error).toMatch(/database migrations/i);
    });

    it('29. unauthenticated lifecycle request is rejected with 401', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .send({ status: 'LOST', reason: 'Unauthenticated attempt' });

      expect(res.status).toBe(401);
    });

    it('30. OPERATOR cannot change card lifecycle (403)', async () => {
      const cardId = await provisionAndActivate('NFC-001');
      const res = await request(app)
        .patch(`/api/admin/cards/${cardId}/lifecycle`)
        .set('Cookie', createSessionCookie(operatorUser))
        .send({ status: 'LOST', reason: 'Operator attempt' });

      expect(res.status).toBe(403);
    });

    it('31. non-numeric card id is rejected with 400 (never a 500)', async () => {
      const res = await request(app)
        .patch('/api/admin/cards/not-a-number/lifecycle')
        .set('Cookie', createSessionCookie(adminUser))
        .send({ status: 'LOST', reason: 'Invalid id attempt' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid card id/i);
    });
  });
});
