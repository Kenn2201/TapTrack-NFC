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
let queryHistory = [];
let nextUserId = 1;
let nextCardId = 1;

// Mock db pool
vi.mock('../src/repositories/db.js', () => {
  return {
    default: {
      query: vi.fn(async (text, params = []) => {
        const q = text.replace(/\s+/g, ' ').trim();
        queryHistory.push({ text: q, params });

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

describe('TapTrack NFC v0.5.0 ALPHA — Universal NFC URL Credential Resolution Test Suite', () => {
  let adminUser;
  let operatorUser;
  let standardUser;
  let disabledMemberUser;
  let activeCardRawToken;
  let activeCard;

  beforeEach(() => {
    usersTable = [];
    cardsTable = [];
    queryHistory = [];
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

    // Provision an active card with known raw token (NFC-001)
    activeCardRawToken = nfcCredentialService.generateRawCredential();
    const tokenHash = nfcCredentialService.deriveCredentialHash(activeCardRawToken);

    activeCard = {
      id: nextCardId++,
      card_label: 'NFC-001',
      token_hash: tokenHash,
      status: 'ACTIVE',
      user_id: standardUser.id,
      issued_by: adminUser.id,
      issued_at: new Date().toISOString(),
      activated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    cardsTable.push(activeCard);
  });

  it('1. Unauthenticated public request successfully resolves active card with privacy-preserving safe payload', async () => {
    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: activeCardRawToken });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.card.cardLabel).toBe('NFC-001');
    expect(res.body.card.status).toBe('ACTIVE');
    expect(res.body.member.displayName).toBe('John B.');
    expect(res.body.isPublic).toBe(true);

    // CRITICAL: Public resolution MUST NOT leak member email address
    expect(res.body.member.email).toBeUndefined();
    // CRITICAL: NEVER leak token or token_hash
    expect(res.body.token).toBeUndefined();
    expect(res.body.token_hash).toBeUndefined();
  });

  it('2. Authenticated operator receives full member details including email', async () => {
    const res = await request(app)
      .post('/api/nfc/resolve')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: activeCardRawToken });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.card.cardLabel).toBe('NFC-001');
    expect(res.body.member.displayName).toBe('John Beans');
    expect(res.body.member.email).toBe('member@taptrack.test');
    expect(res.body.isPublic).toBe(false);
  });

  it('3. Authenticated admin receives full member details', async () => {
    const res = await request(app)
      .post('/api/nfc/resolve')
      .set('Cookie', createAuthCookie(adminUser))
      .send({ token: activeCardRawToken });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.member.email).toBe('member@taptrack.test');
    expect(res.body.isPublic).toBe(false);
  });

  it('4. Authenticated standard user receives safe public payload (no operator escalation)', async () => {
    const res = await request(app)
      .post('/api/nfc/resolve')
      .set('Cookie', createAuthCookie(standardUser))
      .send({ token: activeCardRawToken });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.member.email).toBeUndefined();
    expect(res.body.isPublic).toBe(true);
  });

  it('5. Unrecognized credential token returns 404 CARD_NOT_FOUND', async () => {
    const bogusToken = nfcCredentialService.generateRawCredential();
    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: bogusToken });

    expect(res.status).toBe(404);
    expect(res.body.valid).toBe(false);
    expect(res.body.code).toBe('CARD_NOT_FOUND');
    expect(res.body.error).toMatch(/unrecognized/i);
  });

  it('6. UNASSIGNED card returns 400 CARD_UNASSIGNED', async () => {
    const rawToken = nfcCredentialService.generateRawCredential();
    const hash = nfcCredentialService.deriveCredentialHash(rawToken);
    cardsTable.push({
      id: nextCardId++,
      card_label: 'NFC-UNASSIGNED',
      token_hash: hash,
      status: 'UNASSIGNED',
      user_id: standardUser.id,
    });

    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: rawToken });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CARD_UNASSIGNED');
  });

  it('7. LOST card returns 400 CARD_LOST', async () => {
    const rawToken = nfcCredentialService.generateRawCredential();
    const hash = nfcCredentialService.deriveCredentialHash(rawToken);
    cardsTable.push({
      id: nextCardId++,
      card_label: 'NFC-LOST',
      token_hash: hash,
      status: 'LOST',
      user_id: standardUser.id,
    });

    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: rawToken });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CARD_LOST');
  });

  it('8. REVOKED card returns 400 CARD_REVOKED', async () => {
    const rawToken = nfcCredentialService.generateRawCredential();
    const hash = nfcCredentialService.deriveCredentialHash(rawToken);
    cardsTable.push({
      id: nextCardId++,
      card_label: 'NFC-REVOKED',
      token_hash: hash,
      status: 'REVOKED',
      user_id: standardUser.id,
    });

    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: rawToken });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CARD_REVOKED');
  });

  it('9. REPLACED card returns 400 CARD_REPLACED', async () => {
    const rawToken = nfcCredentialService.generateRawCredential();
    const hash = nfcCredentialService.deriveCredentialHash(rawToken);
    cardsTable.push({
      id: nextCardId++,
      card_label: 'NFC-REPLACED',
      token_hash: hash,
      status: 'REPLACED',
      user_id: standardUser.id,
    });

    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: rawToken });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CARD_REPLACED');
  });

  it('10. DISABLED card returns 400 CARD_DISABLED', async () => {
    const rawToken = nfcCredentialService.generateRawCredential();
    const hash = nfcCredentialService.deriveCredentialHash(rawToken);
    cardsTable.push({
      id: nextCardId++,
      card_label: 'NFC-DISABLED',
      token_hash: hash,
      status: 'DISABLED',
      user_id: standardUser.id,
    });

    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: rawToken });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CARD_DISABLED');
  });

  it('11. Inactive / disabled member account returns 400 MEMBER_INACTIVE', async () => {
    const rawToken = nfcCredentialService.generateRawCredential();
    const hash = nfcCredentialService.deriveCredentialHash(rawToken);
    cardsTable.push({
      id: nextCardId++,
      card_label: 'NFC-INACTIVE-USER',
      token_hash: hash,
      status: 'ACTIVE',
      user_id: disabledMemberUser.id,
    });

    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: rawToken });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MEMBER_INACTIVE');
  });

  it('12. Missing token returns 400 validation error', async () => {
    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({});

    expect(res.status).toBe(400);
  });

  it('13. Empty token string returns 400 validation error', async () => {
    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: '' });

    expect(res.status).toBe(400);
  });

  it('14. Strictly read-only: no attendance records, INSERT, or UPDATE queries executed', async () => {
    queryHistory = [];
    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: activeCardRawToken });

    expect(res.status).toBe(200);
    const writeQueries = queryHistory.filter((q) =>
      q.text.startsWith('INSERT') ||
      q.text.startsWith('UPDATE') ||
      q.text.startsWith('DELETE')
    );
    expect(writeQueries.length).toBe(0);
  });

  it('15. Disabled user session cookie falls back safely to public payload (no privilege escalation)', async () => {
    const res = await request(app)
      .post('/api/nfc/resolve')
      .set('Cookie', createAuthCookie(disabledMemberUser))
      .send({ token: activeCardRawToken });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.isPublic).toBe(true);
    expect(res.body.member.email).toBeUndefined();
  });

  it('16. Malformed or expired session cookie falls back safely to public resolution without 500 error', async () => {
    const res = await request(app)
      .post('/api/nfc/resolve')
      .set('Cookie', 'taptrack_session=corrupt.jwt.payload')
      .send({ token: activeCardRawToken });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.isPublic).toBe(true);
    expect(res.body.member.email).toBeUndefined();
  });

  it('17. Public response strictly excludes internal database identifiers', async () => {
    const res = await request(app)
      .post('/api/nfc/resolve')
      .send({ token: activeCardRawToken });

    expect(res.status).toBe(200);
    expect(res.body.card.id).toBeUndefined();
    expect(res.body.card.card_id).toBeUndefined();
    expect(res.body.card.user_id).toBeUndefined();
    expect(res.body.card.userId).toBeUndefined();
    expect(res.body.member.id).toBeUndefined();
    expect(res.body.member.userId).toBeUndefined();
  });
});
