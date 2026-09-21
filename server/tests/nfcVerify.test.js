import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { nfcCredentialService } from '../src/services/nfcCredential.service.js';
import { config } from '../src/config/index.js';

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
        if (q.includes('FROM nfc_cards') && q.includes('WHERE c.token_hash = $1')) {
          const tokenHash = params[0];
          const card = cardsTable.find((c) => c.token_hash === tokenHash);
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
      }),
    },
  };
});

// Import app after mocking db pool
const { default: app } = await import('../src/app.js');

function createAuthCookie(user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `taptrack_session=${token}`;
}

describe('TapTrack NFC v0.4.0 ALPHA — Web NFC Credential Verification Test Suite', () => {
  let adminUser;
  let operatorUser;
  let standardUser;
  let disabledMemberUser;
  let activeCardRawToken;
  let activeCard;

  beforeEach(() => {
    usersTable = [];
    cardsTable = [];
    nextUserId = 1;
    nextCardId = 1;

    // Seed test users
    adminUser = {
      id: nextUserId++,
      email: 'admin@taptrack.test',
      password_hash: 'hashed_pw',
      first_name: 'Admin',
      last_name: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      email_verified_at: new Date().toISOString(),
    };
    operatorUser = {
      id: nextUserId++,
      email: 'operator@taptrack.test',
      password_hash: 'hashed_pw',
      first_name: 'Operator',
      last_name: 'User',
      role: 'OPERATOR',
      status: 'ACTIVE',
      email_verified_at: new Date().toISOString(),
    };
    standardUser = {
      id: nextUserId++,
      email: 'member@taptrack.test',
      password_hash: 'hashed_pw',
      first_name: 'John',
      last_name: 'Beans',
      role: 'USER',
      status: 'ACTIVE',
      email_verified_at: new Date().toISOString(),
    };
    disabledMemberUser = {
      id: nextUserId++,
      email: 'disabled@taptrack.test',
      password_hash: 'hashed_pw',
      first_name: 'Disabled',
      last_name: 'Member',
      role: 'USER',
      status: 'DISABLED',
      email_verified_at: new Date().toISOString(),
    };
    usersTable.push(adminUser, operatorUser, standardUser, disabledMemberUser);

    // Generate valid raw credential and seed ACTIVE card assigned to standardUser
    activeCardRawToken = nfcCredentialService.generateRawCredential();
    const tokenHash = nfcCredentialService.deriveCredentialHash(activeCardRawToken);

    activeCard = {
      id: nextCardId++,
      card_label: 'NFC-001',
      user_id: standardUser.id,
      token_hash: tokenHash,
      status: 'ACTIVE',
      issued_by: adminUser.id,
      issued_at: new Date().toISOString(),
      activated_at: new Date().toISOString(),
      revoked_at: null,
      revoked_by: null,
      revocation_reason: null,
      replaced_by_card_id: null,
      last_used_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    cardsTable.push(activeCard);
  });

  describe('Health Endpoint Dynamic Versioning', () => {
    it('returns dynamically resolved package.json version from GET /health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ok',
        version: config.version,
      });
    });
  });

  describe('Endpoint Authorization & Role Enforcement', () => {
    it('1. ADMIN can verify an NFC credential', async () => {
      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(adminUser))
        .send({ token: activeCardRawToken });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.card.cardLabel).toBe('NFC-001');
      expect(res.body.card.status).toBe('ACTIVE');
      expect(res.body.member.displayName).toBe('John Beans');
      expect(res.body.member.email).toBe('member@taptrack.test');
    });

    it('2. OPERATOR can verify an NFC credential', async () => {
      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: activeCardRawToken });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.card.cardLabel).toBe('NFC-001');
      expect(res.body.card.status).toBe('ACTIVE');
    });

    it('3. Standard USER cannot verify (forbidden 403)', async () => {
      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(standardUser))
        .send({ token: activeCardRawToken });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('4. Unauthenticated caller cannot verify (unauthorized 401)', async () => {
      const res = await request(app)
        .post('/api/nfc/verify')
        .send({ token: activeCardRawToken });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });
  });

  describe('Credential Derivation & Safe Data Exposure', () => {
    it('5. Correct raw token derives to expected stored HMAC-SHA256', async () => {
      const derived = nfcCredentialService.deriveCredentialHash(activeCardRawToken);
      expect(derived).toBe(activeCard.token_hash);
      expect(derived).toHaveLength(64);
    });

    it('6. ACTIVE card resolves successfully with safe card & member information', async () => {
      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: activeCardRawToken });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        valid: true,
        card: {
          cardLabel: 'NFC-001',
          status: 'ACTIVE',
        },
        member: {
          displayName: 'John Beans',
          email: 'member@taptrack.test',
        },
      });
    });

    it('7. token_hash is NEVER returned in response', async () => {
      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: activeCardRawToken });

      expect(res.body.token_hash).toBeUndefined();
      expect(res.body.card.token_hash).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain(activeCard.token_hash);
    });

    it('8. raw token is NEVER echoed back in response', async () => {
      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: activeCardRawToken });

      expect(res.body.token).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain(activeCardRawToken);
    });

    it('9. Internal database IDs (user_id, card id) are NOT exposed', async () => {
      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: activeCardRawToken });

      expect(res.body.card.id).toBeUndefined();
      expect(res.body.card.userId).toBeUndefined();
      expect(res.body.member.id).toBeUndefined();
    });
  });

  describe('Invalid Tokens & Non-Active Card Lifecycle Rejection', () => {
    it('10. Unknown token is rejected safely with 404 and CARD_NOT_FOUND', async () => {
      const unknownToken = nfcCredentialService.generateRawCredential();
      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: unknownToken });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        valid: false,
        code: 'CARD_NOT_FOUND',
        error: 'Card not found or unrecognized credential.',
      });
    });

    it('11. UNASSIGNED card is rejected with 400 and CARD_UNASSIGNED', async () => {
      const unassignedToken = nfcCredentialService.generateRawCredential();
      cardsTable.push({
        id: nextCardId++,
        card_label: 'NFC-002',
        user_id: standardUser.id,
        token_hash: nfcCredentialService.deriveCredentialHash(unassignedToken),
        status: 'UNASSIGNED',
      });

      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: unassignedToken });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        valid: false,
        code: 'CARD_UNASSIGNED',
        error: 'Card has not been activated yet.',
      });
    });

    it('12. LOST card is rejected with 400 and CARD_LOST', async () => {
      const lostToken = nfcCredentialService.generateRawCredential();
      cardsTable.push({
        id: nextCardId++,
        card_label: 'NFC-003',
        user_id: standardUser.id,
        token_hash: nfcCredentialService.deriveCredentialHash(lostToken),
        status: 'LOST',
      });

      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: lostToken });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CARD_LOST');
    });

    it('13. REVOKED card is rejected with 400 and CARD_REVOKED', async () => {
      const revokedToken = nfcCredentialService.generateRawCredential();
      cardsTable.push({
        id: nextCardId++,
        card_label: 'NFC-004',
        user_id: standardUser.id,
        token_hash: nfcCredentialService.deriveCredentialHash(revokedToken),
        status: 'REVOKED',
      });

      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: revokedToken });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CARD_REVOKED');
    });

    it('14. REPLACED card is rejected with 400 and CARD_REPLACED', async () => {
      const replacedToken = nfcCredentialService.generateRawCredential();
      cardsTable.push({
        id: nextCardId++,
        card_label: 'NFC-005',
        user_id: standardUser.id,
        token_hash: nfcCredentialService.deriveCredentialHash(replacedToken),
        status: 'REPLACED',
      });

      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: replacedToken });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CARD_REPLACED');
    });

    it('15. DISABLED card is rejected with 400 and CARD_DISABLED', async () => {
      const disabledToken = nfcCredentialService.generateRawCredential();
      cardsTable.push({
        id: nextCardId++,
        card_label: 'NFC-006',
        user_id: standardUser.id,
        token_hash: nfcCredentialService.deriveCredentialHash(disabledToken),
        status: 'DISABLED',
      });

      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: disabledToken });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CARD_DISABLED');
    });

    it('16. Card with disabled assigned user is rejected with 400 and MEMBER_INACTIVE', async () => {
      const disabledUserToken = nfcCredentialService.generateRawCredential();
      cardsTable.push({
        id: nextCardId++,
        card_label: 'NFC-007',
        user_id: disabledMemberUser.id,
        token_hash: nfcCredentialService.deriveCredentialHash(disabledUserToken),
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: disabledUserToken });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MEMBER_INACTIVE');
    });

    it('17. Card without assigned user is rejected with 400 and MEMBER_NOT_ASSIGNED', async () => {
      const unassignedUserToken = nfcCredentialService.generateRawCredential();
      cardsTable.push({
        id: nextCardId++,
        card_label: 'NFC-008',
        user_id: null,
        token_hash: nfcCredentialService.deriveCredentialHash(unassignedUserToken),
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({ token: unassignedUserToken });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MEMBER_NOT_ASSIGNED');
    });
  });

  describe('Request Validation & HTTP Method Constraints', () => {
    it('18. Empty or missing token in body is rejected with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.token).toBeDefined();
    });

    it('19. Token in query parameter is NOT accepted when body is empty', async () => {
      const res = await request(app)
        .post(`/api/nfc/verify?token=${activeCardRawToken}`)
        .set('Cookie', createAuthCookie(operatorUser))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.token).toBeDefined();
    });

    it('20. GET to /api/nfc/verify is not allowed (returns 404)', async () => {
      const res = await request(app)
        .get('/api/nfc/verify')
        .set('Cookie', createAuthCookie(operatorUser));

      expect(res.status).toBe(404);
    });
  });
});
