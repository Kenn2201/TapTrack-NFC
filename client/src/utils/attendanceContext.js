/**
 * Operator iPhone Attendance Mode context.
 *
 * Stored on the frontend origin (nfc.kenncode.me) in same-origin localStorage.
 * The server remains authoritative; this never stores NFC tokens or member data.
 */

export const ATTENDANCE_CONTEXT_STORAGE_KEY = 'taptrack.attendanceContext';
export const ATTENDANCE_CONTEXT_ALLOWED_KEYS = Object.freeze(['sessionId', 'eventId', 'expiresAt']);
export const ATTENDANCE_CONTEXT_TTL_MS = 8 * 60 * 60 * 1000;

const FORBIDDEN_SERIALIZED_PATTERNS = [
  'token',
  'tokenHash',
  'token_hash',
  'email',
  'member',
];

function getLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

/**
 * Build a persistable attendance context. Extra keys and secrets are dropped.
 */
export function serializeAttendanceContext(input) {
  if (!input || typeof input !== 'object') return null;

  const sessionId = Number(input.sessionId);
  if (!isPositiveInteger(sessionId)) return null;

  const payload = { sessionId };

  if (input.eventId != null && input.eventId !== '') {
    const eventId = Number(input.eventId);
    if (!isPositiveInteger(eventId)) return null;
    payload.eventId = eventId;
  }

  const expiresAt = input.expiresAt
    ? new Date(input.expiresAt).toISOString()
    : new Date(Date.now() + ATTENDANCE_CONTEXT_TTL_MS).toISOString();

  if (Number.isNaN(Date.parse(expiresAt))) return null;
  payload.expiresAt = expiresAt;

  const serialized = JSON.stringify(payload);
  for (const pattern of FORBIDDEN_SERIALIZED_PATTERNS) {
    if (Object.prototype.hasOwnProperty.call(input, pattern) && serialized.includes(`"${pattern}"`)) {
      return null;
    }
  }

  return payload;
}

export function isAttendanceContextExpired(context, now = Date.now()) {
  if (!context?.expiresAt) return true;
  const expires = Date.parse(context.expiresAt);
  return Number.isNaN(expires) || expires <= now;
}

export function readAttendanceContext() {
  const storage = getLocalStorage();
  if (!storage) return null;

  let raw;
  try {
    raw = storage.getItem(ATTENDANCE_CONTEXT_STORAGE_KEY);
  } catch {
    return null;
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const sanitized = serializeAttendanceContext(parsed);
    if (!sanitized || isAttendanceContextExpired(sanitized)) {
      clearAttendanceContext();
      return null;
    }

    const extraKeys = Object.keys(parsed).filter((key) => !ATTENDANCE_CONTEXT_ALLOWED_KEYS.includes(key));
    if (extraKeys.length > 0) {
      clearAttendanceContext();
      return null;
    }

    return sanitized;
  } catch {
    clearAttendanceContext();
    return null;
  }
}

export function saveAttendanceContext(input) {
  const payload = serializeAttendanceContext(input);
  const storage = getLocalStorage();
  if (!payload || !storage) return null;

  try {
    storage.setItem(ATTENDANCE_CONTEXT_STORAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

export function startAttendanceContext({ sessionId, eventId, ttlMs = ATTENDANCE_CONTEXT_TTL_MS } = {}) {
  return saveAttendanceContext({
    sessionId,
    eventId,
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  });
}

export function clearAttendanceContext() {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(ATTENDANCE_CONTEXT_STORAGE_KEY);
  } catch {
    // Ignore storage access errors
  }
}

export function hasActiveAttendanceMode(context = readAttendanceContext()) {
  return Boolean(context && isPositiveInteger(context.sessionId) && !isAttendanceContextExpired(context));
}

export function decideTapMode(context = readAttendanceContext()) {
  return hasActiveAttendanceMode(context) ? 'attendance' : 'resolve';
}

export function buildUrlCheckInRequest(token, context) {
  return {
    token,
    sessionId: context.sessionId,
  };
}

/**
 * Map authenticated URL check-in failures. Never treats these as public resolve.
 */
export function classifyUrlCheckInFailure(err) {
  const status = err?.status;
  const code = err?.data?.code || err?.code;
  const rawMessage = err?.data?.error || err?.message || '';

  if (status === 401 || status === 403) {
    return {
      ui: 'UNAUTHORIZED',
      code: 'ATTENDANCE_MODE_UNAUTHORIZED',
      message: 'Attendance mode is no longer authorized.',
      clearContext: true,
      recorded: false,
    };
  }

  if (code === 'SESSION_CLOSED') {
    return {
      ui: 'CLOSED',
      code,
      message: 'Attendance Session Closed.',
      clearContext: true,
      recorded: false,
    };
  }

  if (code === 'ALREADY_RECORDED') {
    return {
      ui: 'DUPLICATE',
      code,
      message: 'Already Recorded.',
      clearContext: false,
      recorded: false,
    };
  }

  if (code === 'SESSION_NOT_FOUND' || code === 'EVENT_NOT_FOUND' || code === 'SESSION_EVENT_MISMATCH') {
    return {
      ui: 'INVALID_SESSION',
      code,
      message: rawMessage || 'Attendance session is no longer valid.',
      clearContext: true,
      recorded: false,
    };
  }

  if ([
    'CARD_NOT_ACTIVE',
    'CARD_LOST',
    'CARD_REVOKED',
    'CARD_REPLACED',
    'CARD_DISABLED',
    'CARD_UNASSIGNED',
    'CARD_NOT_FOUND',
    'MEMBER_INACTIVE',
    'MEMBER_NOT_ASSIGNED',
    'USER_NOT_ACTIVE',
    'CARD_USER_MISMATCH',
    'INVALID_TOKEN',
    'INVALID_TOKEN_FORMAT',
  ].includes(code)) {
    return {
      ui: 'CARD_ERROR',
      code,
      message: rawMessage || 'Card cannot be used for attendance.',
      clearContext: false,
      recorded: false,
    };
  }

  return {
    ui: 'NETWORK_ERROR',
    code: code || 'NETWORK_ERROR',
    message: rawMessage || 'Unable to record attendance.',
    clearContext: false,
    recorded: false,
  };
}
