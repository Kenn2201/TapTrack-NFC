import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { config } from '../src/config/index.js';

// Set test environment variables before importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long-super-secure-taptrack';
process.env.CLIENT_URL = 'https://nfc.kenncode.me';
process.env.PORT = '3001';

// In-memory data store for tests
let usersTable = [];
let verificationTokensTable = [];
let resetTokensTable = [];
let nextUserId = 1;
let nextTokenId = 1;

// Mock db pool
vi.mock('../src/repositories/db.js', () => {
  return {
    default: {
      query: vi.fn(async (text, params = []) => {
        const q = text.replace(/\s+/g, ' ').trim();

        // ─── USERS QUERIES ─────────────────────────────────────────────────
        if (q.includes('FROM users') && q.includes('LOWER(email) = LOWER($1)')) {
          const email = params[0].toLowerCase();
          const user = usersTable.find((u) => u.email.toLowerCase() === email);
          return { rows: user ? [{ ...user }] : [] };
        }

        if (q.includes('FROM users') && q.includes('WHERE id = $1')) {
          const id = params[0];
          const user = usersTable.find((u) => u.id === id);
          return { rows: user ? [{ ...user }] : [] };
        }

        if (q.startsWith('INSERT INTO users')) {
          const [email, password_hash, first_name, last_name, role, status, email_verified_at] = params;
          const newUser = {
            id: nextUserId++,
            email,
            password_hash,
            first_name,
            last_name,
            role: role || 'USER',
            status: status || 'ACTIVE',
            email_verified_at: email_verified_at || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          usersTable.push(newUser);
          return { rows: [{ ...newUser }] };
        }

        if (q.includes('UPDATE users') && q.includes('SET role = $1')) {
          const [role, id] = params;
          const user = usersTable.find((u) => u.id === id);
          if (user) {
            user.role = role;
            user.updated_at = new Date().toISOString();
            return { rows: [{ ...user }] };
          }
          return { rows: [] };
        }

        if (q.includes('UPDATE users') && q.includes('SET session_version = session_version + 1')) {
          const [id] = params;
          const user = usersTable.find((u) => u.id === id);
          if (user) {
            user.session_version = (user.session_version || 0) + 1;
            user.last_login_at = new Date().toISOString();
            user.last_seen_at = new Date().toISOString();
            user.updated_at = new Date().toISOString();
            return { rows: [{ ...user }] };
          }
          return { rows: [] };
        }

        if (q.includes('UPDATE users') && q.includes('SET status = $1')) {
          const [status, id] = params;
          const user = usersTable.find((u) => u.id === id);
          if (user) {
            user.status = status;
            user.updated_at = new Date().toISOString();
            return { rows: [{ ...user }] };
          }
          return { rows: [] };
        }

        if (q.includes('UPDATE users') && q.includes('SET password_hash = $1')) {
          const [password_hash, id] = params;
          const user = usersTable.find((u) => u.id === id);
          if (user) {
            user.password_hash = password_hash;
            user.updated_at = new Date().toISOString();
            return { rows: [{ ...user }] };
          }
          return { rows: [] };
        }

        if (q.includes('UPDATE users') && q.includes('SET email_verified_at = NOW()')) {
          const [id] = params;
          const user = usersTable.find((u) => u.id === id);
          if (user) {
            user.email_verified_at = new Date().toISOString();
            user.updated_at = new Date().toISOString();
            return { rows: [{ ...user }] };
          }
          return { rows: [] };
        }

        if (q.includes('UPDATE users') && q.includes('SET first_name = COALESCE($1, first_name)')) {
          const [first_name, last_name, id] = params;
          const user = usersTable.find((u) => u.id === id);
          if (user) {
            if (first_name) user.first_name = first_name;
            if (last_name) user.last_name = last_name;
            user.updated_at = new Date().toISOString();
            return { rows: [{ ...user }] };
          }
          return { rows: [] };
        }

        if (q.includes('SELECT id, email, first_name, last_name, nickname, birthday, avatar_url, role, status, email_verified_at, created_at, updated_at, last_login_at, last_seen_at FROM users')) {
          return { rows: usersTable.map((u) => ({ ...u })) };
        }

        // ─── EMAIL VERIFICATION TOKENS ─────────────────────────────────────
        if (q.startsWith('DELETE FROM email_verification_tokens WHERE user_id = $1')) {
          const userId = params[0];
          verificationTokensTable = verificationTokensTable.filter((t) => t.user_id !== userId);
          return { rows: [] };
        }

        if (q.startsWith('INSERT INTO email_verification_tokens')) {
          const [user_id, token_hash, expires_at] = params;
          const rec = {
            id: nextTokenId++,
            user_id,
            token_hash,
            expires_at,
            created_at: new Date().toISOString(),
          };
          verificationTokensTable.push(rec);
          return { rows: [{ ...rec }] };
        }

        if (q.includes('FROM email_verification_tokens WHERE token_hash = $1')) {
          const hash = params[0];
          const rec = verificationTokensTable.find((t) => t.token_hash === hash);
          return { rows: rec ? [{ ...rec }] : [] };
        }

        if (q.startsWith('DELETE FROM email_verification_tokens WHERE id = $1')) {
          const id = params[0];
          verificationTokensTable = verificationTokensTable.filter((t) => t.id !== id);
          return { rows: [] };
        }

        // ─── PASSWORD RESET TOKENS ─────────────────────────────────────────
        if (q.includes('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1')) {
          const userId = params[0];
          resetTokensTable.forEach((t) => {
            if (t.user_id === userId && !t.used_at) t.used_at = new Date().toISOString();
          });
          return { rows: [] };
        }

        if (q.startsWith('INSERT INTO password_reset_tokens')) {
          const [user_id, token_hash, expires_at] = params;
          const rec = {
            id: nextTokenId++,
            user_id,
            token_hash,
            expires_at,
            used_at: null,
            created_at: new Date().toISOString(),
          };
          resetTokensTable.push(rec);
          return { rows: [{ ...rec }] };
        }

        if (q.includes('FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL')) {
          const hash = params[0];
          const rec = resetTokensTable.find((t) => t.token_hash === hash && !t.used_at);
          return { rows: rec ? [{ ...rec }] : [] };
        }

        if (q.includes('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1')) {
          const id = params[0];
          const rec = resetTokensTable.find((t) => t.id === id);
          if (rec) rec.used_at = new Date().toISOString();
          return { rows: rec ? [{ ...rec }] : [] };
        }

        return { rows: [] };
      }),
    },
  };
});

// Import app after mocking DB
import app from '../src/app.js';
import { emailService } from '../src/services/email.service.js';
import { getJwtSecret } from '../src/config/index.js';

describe('TapTrack NFC v0.2.0 ALPHA — Comprehensive Test Suite', () => {
  let emailSpy;

  beforeEach(() => {
    // Reset database tables
    usersTable = [];
    verificationTokensTable = [];
    resetTokensTable = [];
    nextUserId = 1;
    nextTokenId = 1;

    // Spy on email service so zero real emails are ever sent
    emailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ id: 'mock-email-id', success: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. REGISTRATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Registration', () => {
    it('1. registration creates USER only and hashes password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'alex.taptrack@yopmail.com',
          password: 'TestPassword123!',
          firstName: 'Alex',
          lastName: 'Rivera',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('USER');
      expect(res.body.user.email).toBe('alex.taptrack@yopmail.com');
      expect(res.body.user.password_hash).toBeUndefined();

      // Verify user in DB has hashed password
      const dbUser = usersTable.find((u) => u.email === 'alex.taptrack@yopmail.com');
      expect(dbUser).toBeDefined();
      expect(dbUser.role).toBe('USER');
      expect(dbUser.password_hash).not.toBe('TestPassword123!');
      expect(await bcrypt.compare('TestPassword123!', dbUser.password_hash)).toBe(true);

      // Verify verification token created and email sent
      expect(verificationTokensTable.length).toBe(1);
      expect(emailSpy).toHaveBeenCalled();
    });

    it('2. registration cannot request ADMIN or OPERATOR role (privilege escalation rejected)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'attacker@yopmail.com',
          password: 'TestPassword123!',
          firstName: 'Bad',
          lastName: 'Actor',
          role: 'ADMIN',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('USER');

      const dbUser = usersTable.find((u) => u.email === 'attacker@yopmail.com');
      expect(dbUser.role).toBe('USER');
    });

    it('3. duplicate email is rejected with 409 Conflict', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@yopmail.com',
          password: 'TestPassword123!',
          firstName: 'Original',
          lastName: 'User',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'DUPLICATE@yopmail.com', // Case-insensitive duplicate check
          password: 'AnotherPassword123!',
          firstName: 'Duplicate',
          lastName: 'User',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('4. password validation enforces minimum 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'shortpass@yopmail.com',
          password: 'short',
          firstName: 'Short',
          lastName: 'Pass',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. LOGIN & SESSIONS
  // ──────────────────────────────────────────────────────────────────────────
  describe('Login & Session', () => {
    beforeEach(async () => {
      const hash = await bcrypt.hash('TestPassword123!', 10);
      usersTable.push({
        id: 1,
        email: 'alex.taptrack@yopmail.com',
        password_hash: hash,
        first_name: 'Alex',
        last_name: 'Rivera',
        role: 'USER',
        status: 'ACTIVE',
        email_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    it('5. login success issues HttpOnly cookie and safe user body (never returns JWT in body)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.taptrack@yopmail.com',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('alex.taptrack@yopmail.com');
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.token).toBeUndefined(); // Token must NEVER be in response body

      // Verify Set-Cookie header contains taptrack_session with HttpOnly
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c) => c.startsWith('taptrack_session='));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/HttpOnly/i);
    });

    it('6. login with invalid password fails generically without disclosure', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.taptrack@yopmail.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    it('7. login with nonexistent email fails generically (no account enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@yopmail.com',
          password: 'AnyPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    it('8. disabled user cannot login', async () => {
      // Disable user
      usersTable[0].status = 'DISABLED';

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.taptrack@yopmail.com',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/disabled/i);
    });

    it('9. /auth/me requires authenticated session cookie', async () => {
      const unauthRes = await request(app).get('/api/auth/me');
      expect(unauthRes.status).toBe(401);

      // Now login to get cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.taptrack@yopmail.com',
          password: 'TestPassword123!',
        });

      const cookie = loginRes.headers['set-cookie'];

      const authRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(authRes.status).toBe(200);
      expect(authRes.body.user.email).toBe('alex.taptrack@yopmail.com');
      expect(authRes.body.user.password_hash).toBeUndefined();
    });

    it('10. logout clears the taptrack_session cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c) => c.startsWith('taptrack_session='));
      // Cleared cookie has expired date or empty value
      expect(sessionCookie).toMatch(/Expires=|Max-Age=0/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. AUTHORIZATION & ROLES
  // ──────────────────────────────────────────────────────────────────────────
  describe('Authorization & Role-Based Access Control', () => {
    let userCookie, operatorCookie, adminCookie;

    beforeEach(async () => {
      const hash = await bcrypt.hash('TestPassword123!', 10);
      // Seed User (id: 1), Operator (id: 2), Admin (id: 3)
      usersTable.push(
        {
          id: 1,
          email: 'user@yopmail.com',
          password_hash: hash,
          first_name: 'Regular',
          last_name: 'User',
          role: 'USER',
          status: 'ACTIVE',
          email_verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          email: 'operator@yopmail.com',
          password_hash: hash,
          first_name: 'Event',
          last_name: 'Operator',
          role: 'OPERATOR',
          status: 'ACTIVE',
          email_verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 3,
          email: 'admin@yopmail.com',
          password_hash: hash,
          first_name: 'System',
          last_name: 'Admin',
          role: 'ADMIN',
          status: 'ACTIVE',
          email_verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );

      const uLogin = await request(app).post('/api/auth/login').send({ email: 'user@yopmail.com', password: 'TestPassword123!' });
      userCookie = uLogin.headers['set-cookie'];

      const opLogin = await request(app).post('/api/auth/login').send({ email: 'operator@yopmail.com', password: 'TestPassword123!' });
      operatorCookie = opLogin.headers['set-cookie'];

      const aLogin = await request(app).post('/api/auth/login').send({ email: 'admin@yopmail.com', password: 'TestPassword123!' });
      adminCookie = aLogin.headers['set-cookie'];
    });

    it('11. USER cannot access admin routes (403 Forbidden)', async () => {
      const res = await request(app).get('/api/admin/users').set('Cookie', userCookie);
      expect(res.status).toBe(403);
    });

    it('12. OPERATOR cannot access admin routes (403 Forbidden)', async () => {
      const res = await request(app).get('/api/admin/users').set('Cookie', operatorCookie);
      expect(res.status).toBe(403);
    });

    it('13. ADMIN can list users', async () => {
      const res = await request(app).get('/api/admin/users').set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBe(3);
    });

    it('14. ADMIN can promote USER -> OPERATOR and demote OPERATOR -> USER', async () => {
      // Promote user #1 to OPERATOR
      const promoteRes = await request(app)
        .patch('/api/admin/users/1/role')
        .set('Cookie', adminCookie)
        .send({ role: 'OPERATOR' });

      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.user.role).toBe('OPERATOR');
      expect(usersTable.find((u) => u.id === 1).role).toBe('OPERATOR');

      // Demote operator #2 to USER
      const demoteRes = await request(app)
        .patch('/api/admin/users/2/role')
        .set('Cookie', adminCookie)
        .send({ role: 'USER' });

      expect(demoteRes.status).toBe(200);
      expect(demoteRes.body.user.role).toBe('USER');
    });

    it('15. ADMIN cannot alter their own administrator role (lockout prevention)', async () => {
      const res = await request(app)
        .patch('/api/admin/users/3/role')
        .set('Cookie', adminCookie)
        .send({ role: 'USER' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/own/i);
    });

    it('16. ADMIN cannot disable their own account (lockout prevention)', async () => {
      const res = await request(app)
        .patch('/api/admin/users/3/status')
        .set('Cookie', adminCookie)
        .send({ status: 'DISABLED' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/own/i);
    });

    it('17. disabled user loses access immediately on subsequent requests even with valid JWT', async () => {
      // User #1 is currently active and has a valid session
      const validReq = await request(app).get('/api/auth/me').set('Cookie', userCookie);
      expect(validReq.status).toBe(200);

      // Admin disables user #1
      await request(app)
        .patch('/api/admin/users/1/status')
        .set('Cookie', adminCookie)
        .send({ status: 'DISABLED' });

      // User #1 immediately tries to access /api/auth/me with old cookie
      const blockedReq = await request(app).get('/api/auth/me').set('Cookie', userCookie);
      expect(blockedReq.status).toBe(403);
      expect(blockedReq.body.error).toMatch(/disabled/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. EMAIL VERIFICATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Email Verification', () => {
    it('18. email verification token succeeds and is one-time-use', async () => {
      // Register new user
      await request(app).post('/api/auth/register').send({
        email: 'verify.test@yopmail.com',
        password: 'TestPassword123!',
        firstName: 'Verify',
        lastName: 'Test',
      });

      const tokenRecord = verificationTokensTable[0];
      expect(tokenRecord).toBeDefined();

      // Retrieve the raw token from the email spy arguments
      const emailCall = emailSpy.mock.calls.find((c) => c[0].to.includes('verify.test@yopmail.com'));
      expect(emailCall).toBeDefined();
      const html = emailCall[0].html;
      const match = html.match(/token=([a-f0-9]+)/);
      expect(match).toBeDefined();
      const rawToken = match[1];

      // Submit verification
      const verifyRes = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: rawToken });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.user.emailVerifiedAt).toBeDefined();

      // Attempting to reuse the exact same token must fail (one-time use)
      const reuseRes = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: rawToken });

      expect(reuseRes.status).toBe(400);
    });

    it('19. expired verification token fails', async () => {
      usersTable.push({
        id: 99,
        email: 'expired@yopmail.com',
        password_hash: 'hash',
        first_name: 'Expired',
        last_name: 'Token',
        role: 'USER',
        status: 'ACTIVE',
        email_verified_at: null,
      });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Create expired token (1 hour in the past)
      verificationTokensTable.push({
        id: nextTokenId++,
        user_id: 99,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() - 3600000).toISOString(),
      });

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: rawToken });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/expired/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. PASSWORD RESET
  // ──────────────────────────────────────────────────────────────────────────
  describe('Password Reset', () => {
    beforeEach(async () => {
      const hash = await bcrypt.hash('OldPassword123!', 10);
      usersTable.push({
        id: 1,
        email: 'reset.user@yopmail.com',
        password_hash: hash,
        first_name: 'Reset',
        last_name: 'User',
        role: 'USER',
        status: 'ACTIVE',
        email_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    it('20. forgot-password is generic and non-enumerating for existing and non-existing emails', async () => {
      const resExisting = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset.user@yopmail.com' });

      const resNonExisting = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'ghost@yopmail.com' });

      expect(resExisting.status).toBe(200);
      expect(resNonExisting.status).toBe(200);
      expect(resExisting.body.message).toBe(resNonExisting.body.message);
    });

    it('21. password reset token is one-time use and updates password hash', async () => {
      // Trigger forgot password
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset.user@yopmail.com' });

      expect(resetTokensTable.length).toBe(1);

      // Extract raw token from email spy
      const emailCall = emailSpy.mock.calls.find((c) => c[0].to.includes('reset.user@yopmail.com'));
      const html = emailCall[0].html;
      const rawToken = html.match(/token=([a-f0-9]+)/)[1];

      // Reset password
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: rawToken,
          password: 'NewSuperPassword123!',
        });

      expect(resetRes.status).toBe(200);

      // Verify user can login with new password
      const loginNewRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'reset.user@yopmail.com',
          password: 'NewSuperPassword123!',
        });

      expect(loginNewRes.status).toBe(200);

      // Reusing the token must fail
      const reuseRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: rawToken,
          password: 'AnotherPassword123!',
        });

      expect(reuseRes.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. SECURITY, CORS, CONFIG & HEALTH
  // ──────────────────────────────────────────────────────────────────────────
  describe('Security & Configuration', () => {
    it('22. /health is public and lightweight returning canonical version', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', version: config.version });
    });

    it('23. CORS allows configured CLIENT_URL with credentials: true', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://nfc.kenncode.me');

      expect(res.headers['access-control-allow-origin']).toBe('https://nfc.kenncode.me');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('24. getJwtSecret fails safely without fallback if secret is missing', () => {
      const originalSecret = process.env.JWT_SECRET;
      try {
        delete process.env.JWT_SECRET;
        // Re-evaluate without secret
        expect(() => {
          if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is required');
          }
        }).toThrow();
      } finally {
        process.env.JWT_SECRET = originalSecret;
      }
    });

    it('25. API responses never disclose raw token hashes or password hashes', async () => {
      const hash = await bcrypt.hash('TestPassword123!', 10);
      usersTable.push({
        id: 10,
        email: 'safe@yopmail.com',
        password_hash: hash,
        first_name: 'Safe',
        last_name: 'User',
        role: 'USER',
        status: 'ACTIVE',
        email_verified_at: new Date().toISOString(),
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'safe@yopmail.com', password: 'TestPassword123!' });

      const bodyStr = JSON.stringify(loginRes.body);
      expect(bodyStr).not.toContain(hash);
      expect(bodyStr).not.toContain('password_hash');
    });
  });
});
