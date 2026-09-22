import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTENDANCE_CONTEXT_ALLOWED_KEYS,
  ATTENDANCE_CONTEXT_STORAGE_KEY,
  serializeAttendanceContext,
  saveAttendanceContext,
  readAttendanceContext,
  clearAttendanceContext,
  startAttendanceContext,
  hasActiveAttendanceMode,
  decideTapMode,
  buildUrlCheckInRequest,
  classifyUrlCheckInFailure,
} from '../src/utils/attendanceContext.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

describe('iPhone attendanceContext persistence', () => {
  test('serialized context contains only allowed keys', () => {
    const payload = serializeAttendanceContext({
      sessionId: 20,
      eventId: 10,
      expiresAt: '2026-12-01T00:00:00.000Z',
      token: 'should-never-persist-this-secret-token',
      tokenHash: 'abc',
      token_hash: 'def',
      email: 'operator@example.com',
      member: { displayName: 'Ada' },
    });

    assert.ok(payload);
    assert.deepEqual(Object.keys(payload).sort(), ['eventId', 'expiresAt', 'sessionId'].sort());
    for (const key of Object.keys(payload)) {
      assert.equal(ATTENDANCE_CONTEXT_ALLOWED_KEYS.includes(key), true);
    }

    const serialized = JSON.stringify(payload);
    assert.equal(serialized.includes('token'), false);
    assert.equal(serialized.includes('tokenHash'), false);
    assert.equal(serialized.includes('token_hash'), false);
    assert.equal(serialized.includes('email'), false);
    assert.equal(serialized.includes('member'), false);
    assert.equal(serialized.includes('should-never-persist'), false);
    assert.equal(serialized.includes('operator@example.com'), false);
  });

  test('persisted localStorage value cannot keep token, hash, member, or email fields', () => {
    const storage = createMemoryStorage();
    globalThis.window = { localStorage: storage };

    const saved = saveAttendanceContext({
      sessionId: 7,
      eventId: 3,
      expiresAt: '2026-12-01T00:00:00.000Z',
      token: '4nF7-y9_kL02pQmZ1aBcDeFgHiJkLmNo',
      tokenHash: 'deadbeef',
      token_hash: 'deadbeef',
      member: { displayName: 'Ada Lovelace', email: 'ada@example.com' },
      email: 'ada@example.com',
    });

    assert.ok(saved);
    const raw = storage.getItem(ATTENDANCE_CONTEXT_STORAGE_KEY);
    assert.ok(raw);
    assert.equal(raw.includes('token'), false);
    assert.equal(raw.includes('tokenHash'), false);
    assert.equal(raw.includes('token_hash'), false);
    assert.equal(raw.includes('member'), false);
    assert.equal(raw.includes('email'), false);
    assert.equal(raw.includes('4nF7-y9_kL02pQmZ1aBcDeFgHiJkLmNo'), false);
    assert.equal(raw.includes('deadbeef'), false);
    assert.equal(raw.includes('ada@example.com'), false);
    assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ['eventId', 'expiresAt', 'sessionId'].sort());

    clearAttendanceContext();
    delete globalThis.window;
  });

  test('malformed or expired stored context is cleared', () => {
    const storage = createMemoryStorage();
    globalThis.window = { localStorage: storage };

    storage.setItem(ATTENDANCE_CONTEXT_STORAGE_KEY, '{not-json');
    assert.equal(readAttendanceContext(), null);
    assert.equal(storage.getItem(ATTENDANCE_CONTEXT_STORAGE_KEY), null);

    storage.setItem(ATTENDANCE_CONTEXT_STORAGE_KEY, JSON.stringify({
      sessionId: 1,
      expiresAt: '2000-01-01T00:00:00.000Z',
    }));
    assert.equal(readAttendanceContext(), null);
    assert.equal(storage.getItem(ATTENDANCE_CONTEXT_STORAGE_KEY), null);

    storage.setItem(ATTENDANCE_CONTEXT_STORAGE_KEY, JSON.stringify({
      sessionId: 1,
      expiresAt: '2026-12-01T00:00:00.000Z',
      token: 'leak-me',
    }));
    assert.equal(readAttendanceContext(), null);
    assert.equal(storage.getItem(ATTENDANCE_CONTEXT_STORAGE_KEY), null);

    delete globalThis.window;
  });

  test('active context selects attendance mode; missing context selects public resolve', () => {
    const storage = createMemoryStorage();
    globalThis.window = { localStorage: storage };

    assert.equal(decideTapMode(null), 'resolve');
    assert.equal(hasActiveAttendanceMode(null), false);

    const started = startAttendanceContext({ sessionId: 42, eventId: 9 });
    assert.ok(started);
    assert.equal(decideTapMode(), 'attendance');
    assert.deepEqual(buildUrlCheckInRequest('in-memory-token-only', started), {
      token: 'in-memory-token-only',
      sessionId: 42,
    });

    clearAttendanceContext();
    assert.equal(decideTapMode(), 'resolve');
    delete globalThis.window;
  });

  test('invalid, missing, or non-integer IDs are rejected', () => {
    assert.equal(serializeAttendanceContext({ sessionId: 0 }), null);
    assert.equal(serializeAttendanceContext({ sessionId: -5 }), null);
    assert.equal(serializeAttendanceContext({ sessionId: 3.5 }), null);
    assert.equal(serializeAttendanceContext({ sessionId: 'abc' }), null);
    assert.equal(serializeAttendanceContext({ sessionId: null }), null);
    assert.equal(serializeAttendanceContext({}), null);
    assert.equal(serializeAttendanceContext(null), null);
    assert.equal(serializeAttendanceContext({ sessionId: 9, eventId: 'nope' }), null);
    assert.equal(serializeAttendanceContext({ sessionId: 9, eventId: -2 }), null);
  });

  test('save and reload a valid context round-trips exactly', () => {
    const storage = createMemoryStorage();
    globalThis.window = { localStorage: storage };

    const started = startAttendanceContext({ sessionId: 11, eventId: 4 });
    assert.ok(started);
    assert.equal(started.sessionId, 11);
    assert.equal(started.eventId, 4);

    const loaded = readAttendanceContext();
    assert.ok(loaded);
    assert.equal(loaded.sessionId, 11);
    assert.equal(loaded.eventId, 4);
    assert.equal(typeof loaded.expiresAt, 'string');
    assert.equal(hasActiveAttendanceMode(loaded), true);

    const saved = saveAttendanceContext({ sessionId: 12, eventId: 6, expiresAt: '2026-12-01T00:00:00.000Z' });
    assert.ok(saved);
    const reloaded = readAttendanceContext();
    assert.ok(reloaded);
    assert.deepEqual(reloaded, { sessionId: 12, eventId: 6, expiresAt: '2026-12-01T00:00:00.000Z' });

    clearAttendanceContext();
    delete globalThis.window;
  });

  test('URL check-in failures never map to public resolve fallback', () => {
    const unauthorized = classifyUrlCheckInFailure({ status: 401 });
    assert.equal(unauthorized.ui, 'UNAUTHORIZED');
    assert.equal(unauthorized.message, 'Attendance mode is no longer authorized.');
    assert.equal(unauthorized.clearContext, true);

    const forbidden = classifyUrlCheckInFailure({ status: 403 });
    assert.equal(forbidden.ui, 'UNAUTHORIZED');
    assert.equal(forbidden.clearContext, true);

    const closed = classifyUrlCheckInFailure({ status: 409, data: { code: 'SESSION_CLOSED' } });
    assert.equal(closed.ui, 'CLOSED');
    assert.equal(closed.message, 'Attendance Session Closed.');
    assert.equal(closed.clearContext, true);

    const duplicate = classifyUrlCheckInFailure({ status: 409, data: { code: 'ALREADY_RECORDED' } });
    assert.equal(duplicate.ui, 'DUPLICATE');
    assert.equal(duplicate.message, 'Already Recorded.');
    assert.equal(duplicate.clearContext, false);

    const inactive = classifyUrlCheckInFailure({ status: 409, data: { code: 'CARD_NOT_ACTIVE' } });
    assert.equal(inactive.ui, 'CARD_ERROR');
    assert.equal(inactive.clearContext, false);
  });
});
