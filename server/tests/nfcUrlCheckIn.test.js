import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { nfcCredentialService } from '../src/services/nfcCredential.service.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long-secure-taptrack';
process.env.CARD_TOKEN_PEPPER = 'test-card-pepper-at-least-32-chars-long-secure-taptrack';
process.env.NFC_DOMAIN = 'https://nfc.kenncode.me';
process.env.PORT = '3001';

let usersTable = [];
let cardsTable = [];
let eventsTable = [];
let sessionsTable = [];
let attendanceTable = [];
let auditTable = [];
let nextUserId = 1;
let nextCardId = 1;
let nextEventId = 1;
let nextSessionId = 1;
let nextRecordId = 1;
let nextAuditId = 1;

vi.mock('../src/repositories/db.js', () => {
  return {
    default: {
      query: vi.fn(async (text, params = []) => {
        const q = text.replace(/\s+/g, ' ').trim();

        if (q.startsWith('INSERT INTO attendance_records')) {
          const [eventId, sessionId, userId, cardId, method, recordedBy] = params;
          if (attendanceTable.some((r) => r.session_id === sessionId && r.user_id === userId)) {
            const err = new Error('duplicate key value violates unique constraint');
            err.code = '23505';
            throw err;
          }
          const row = {
            id: nextRecordId++,
            event_id: eventId,
            session_id: sessionId,
            user_id: userId,
            card_id: cardId,
            method,
            recorded_by: recordedBy,
            recorded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };
          attendanceTable.push(row);
          return { rows: [row] };
        }

        if (q.startsWith('INSERT INTO audit_logs')) {
          const row = {
            id: nextAuditId++,
            actor_id: params[0],
            action: params[1],
            entity_type: params[2],
            entity_id: params[3],
            metadata: params[4],
          };
          auditTable.push(row);
          return { rows: [row] };
        }

        if (q.includes('FROM users') && q.includes('WHERE id = $1')) {
          const user = usersTable.find((u) => u.id === params[0]);
          return { rows: user ? [{ ...user }] : [] };
        }

        if (q.includes('FROM nfc_cards') && q.includes('WHERE c.token_hash = $1')) {
          const card = cardsTable.find((c) => c.token_hash === params[0]);
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
          const card = cardsTable.find((c) => c.id === params[0]);
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

        if (q.includes('FROM events e') && q.includes('WHERE e.id = $1')) {
          const event = eventsTable.find((e) => e.id === params[0]);
          return { rows: event ? [{ ...event }] : [] };
        }

        if (q.includes('FROM attendance_sessions') && q.includes('WHERE id = $1')) {
          const session = sessionsTable.find((s) => s.id === params[0]);
          return { rows: session ? [{ ...session }] : [] };
        }

        return { rows: [] };
      }),
    },
  };
});

const { default: app } = await import('../src/app.js');

function createAuthCookie(user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `taptrack_session=${token}`;
}

describe('POST /api/nfc/check-in/url — authenticated iPhone NFC_URL attendance', () => {
  let adminUser;
  let operatorUser;
  let standardUser;
  let memberUser;
  let openEvent;
  let openSession;
  let activeCardRawToken;
  let activeCard;

  beforeEach(() => {
    usersTable = [];
    cardsTable = [];
    eventsTable = [];
    sessionsTable = [];
    attendanceTable = [];
    auditTable = [];
    nextUserId = 1;
    nextCardId = 1;
    nextEventId = 1;
    nextSessionId = 1;
    nextRecordId = 1;
    nextAuditId = 1;

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
    memberUser = standardUser;
    usersTable.push(adminUser, operatorUser, standardUser);

    openEvent = {
      id: nextEventId++,
      name: 'Demo Meetup',
      description: null,
      start_at: '2026-01-01T00:00:00.000Z',
      end_at: '2026-01-02T00:00:00.000Z',
      status: 'OPEN',
      created_by: adminUser.id,
    };
    eventsTable.push(openEvent);

    openSession = {
      id: nextSessionId++,
      event_id: openEvent.id,
      status: 'OPEN',
      opened_at: new Date().toISOString(),
      opened_by: operatorUser.id,
    };
    sessionsTable.push(openSession);

    activeCardRawToken = nfcCredentialService.generateRawCredential();
    activeCard = {
      id: nextCardId++,
      card_label: 'NFC-001',
      token_hash: nfcCredentialService.deriveCredentialHash(activeCardRawToken),
      status: 'ACTIVE',
      user_id: memberUser.id,
      issued_by: adminUser.id,
      issued_at: new Date().toISOString(),
      activated_at: new Date().toISOString(),
    };
    cardsTable.push(activeCard);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .send({ token: activeCardRawToken, sessionId: openSession.id });

    expect(res.status).toBe(401);
    expect(attendanceTable).toHaveLength(0);
  });

  it('rejects USER role with 403', async () => {
    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(standardUser))
      .send({ token: activeCardRawToken, sessionId: openSession.id });

    expect(res.status).toBe(403);
    expect(attendanceTable).toHaveLength(0);
  });

  it('records attendance for ADMIN with method NFC_URL', async () => {
    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(adminUser))
      .send({ token: activeCardRawToken, sessionId: openSession.id, eventId: 9999, method: 'MANUAL' });

    expect(res.status).toBe(201);
    expect(res.body.record.method).toBe('NFC_URL');
    expect(res.body.record.eventId).toBe(openEvent.id);
    expect(res.body.record.sessionId).toBe(openSession.id);
    expect(res.body.card.cardLabel).toBe('NFC-001');
    expect(attendanceTable).toHaveLength(1);
    expect(attendanceTable[0].method).toBe('NFC_URL');
    expect(attendanceTable[0].event_id).toBe(openEvent.id);
  });

  it('records attendance for OPERATOR with method NFC_URL', async () => {
    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: activeCardRawToken, sessionId: openSession.id });

    expect(res.status).toBe(201);
    expect(res.body.record.method).toBe('NFC_URL');
    expect(attendanceTable[0].method).toBe('NFC_URL');
  });

  it('derives event from the session and ignores a client-supplied eventId', async () => {
    const decoyEvent = {
      id: nextEventId++,
      name: 'Decoy Event',
      description: null,
      start_at: '2026-01-01T00:00:00.000Z',
      end_at: '2026-01-02T00:00:00.000Z',
      status: 'OPEN',
      created_by: adminUser.id,
    };
    eventsTable.push(decoyEvent);

    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: activeCardRawToken, sessionId: openSession.id, eventId: decoyEvent.id });

    expect(res.status).toBe(201);
    expect(res.body.record.eventId).toBe(openEvent.id);
    expect(res.body.record.eventId).not.toBe(decoyEvent.id);
  });

  it('rejects a closed session with SESSION_CLOSED and does not insert a record', async () => {
    openSession.status = 'CLOSED';

    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: activeCardRawToken, sessionId: openSession.id });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SESSION_CLOSED');
    expect(attendanceTable).toHaveLength(0);
  });

  it('rejects an invalid session with SESSION_NOT_FOUND', async () => {
    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: activeCardRawToken, sessionId: 99999 });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SESSION_NOT_FOUND');
    expect(attendanceTable).toHaveLength(0);
  });

  it('rejects a malformed token with 400', async () => {
    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: 'short', sessionId: openSession.id });

    expect(res.status).toBe(400);
    expect(attendanceTable).toHaveLength(0);
  });

  it('rejects a lost card using existing lifecycle semantics', async () => {
    const rawToken = nfcCredentialService.generateRawCredential();
    cardsTable.push({
      id: nextCardId++,
      card_label: 'NFC-LOST',
      token_hash: nfcCredentialService.deriveCredentialHash(rawToken),
      status: 'LOST',
      user_id: memberUser.id,
    });

    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: rawToken, sessionId: openSession.id });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CARD_LOST');
    expect(attendanceTable).toHaveLength(0);
  });

  it('rejects a revoked card using existing lifecycle semantics', async () => {
    const rawToken = nfcCredentialService.generateRawCredential();
    cardsTable.push({
      id: nextCardId++,
      card_label: 'NFC-REVOKED',
      token_hash: nfcCredentialService.deriveCredentialHash(rawToken),
      status: 'REVOKED',
      user_id: memberUser.id,
    });

    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: rawToken, sessionId: openSession.id });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CARD_REVOKED');
    expect(attendanceTable).toHaveLength(0);
  });

  it('rejects a disabled / inactive card using existing lifecycle semantics', async () => {
    const rawToken = nfcCredentialService.generateRawCredential();
    cardsTable.push({
      id: nextCardId++,
      card_label: 'NFC-DISABLED',
      token_hash: nfcCredentialService.deriveCredentialHash(rawToken),
      status: 'DISABLED',
      user_id: memberUser.id,
    });

    const res = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: rawToken, sessionId: openSession.id });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CARD_DISABLED');
    expect(attendanceTable).toHaveLength(0);
  });

  it('rejects a duplicate attendance with ALREADY_RECORDED', async () => {
    const first = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: activeCardRawToken, sessionId: openSession.id });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/nfc/check-in/url')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({ token: activeCardRawToken, sessionId: openSession.id });

    expect(second.status).toBe(409);
    expect(second.body.code).toBe('ALREADY_RECORDED');
    expect(attendanceTable).toHaveLength(1);
  });

  it('keeps Android NFC_WEB check-in recording NFC_WEB through the existing route', async () => {
    const res = await request(app)
      .post('/api/nfc/check-in')
      .set('Cookie', createAuthCookie(operatorUser))
      .send({
        token: activeCardRawToken,
        eventId: openEvent.id,
        sessionId: openSession.id,
        method: 'NFC_WEB',
      });

    expect(res.status).toBe(201);
    expect(res.body.record.method).toBe('NFC_WEB');
    expect(attendanceTable).toHaveLength(1);
    expect(attendanceTable[0].method).toBe('NFC_WEB');
  });
});
