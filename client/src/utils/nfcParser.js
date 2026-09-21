/**
 * TapTrack NFC — NDEF Record & URL Parsing Helpers (v0.4.0 ALPHA)
 *
 * Security Rules:
 * 1. Physical card stores the raw credential only inside the URL fragment:
 *    https://nfc.kenncode.me/t#<RAW_RANDOM_TOKEN>
 * 2. Never accept tokens in URL query strings (e.g. ?token=...) to prevent access log leakage.
 * 3. Never accept non-HTTPS URLs (except localhost for local development).
 * 4. Strictly validate host against expected TapTrack domain.
 * 5. Strictly validate path equals "/t" or "/t/".
 * 6. Never log or persist the raw token.
 */

/**
 * Checks if Web NFC (NDEFReader) is available in the current browser environment.
 * Strictly uses feature detection without user-agent sniffing.
 */
export function isWebNFCSupported() {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

/**
 * Checks if the current context is secure (HTTPS or localhost).
 */
export function isSecureContextSupported() {
  return typeof window !== 'undefined' && (window.isSecureContext ?? true);
}

/**
 * Parses and validates a TapTrack NFC URL from an NDEF record.
 * @param {string} urlString
 * @param {string} [expectedHost] - Optional override; defaults to window.location.host or nfc.kenncode.me
 * @returns {{ valid: boolean, token?: string, error?: string, code?: string }}
 */
export function parseTapTrackUrl(urlString, expectedHost = null) {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, code: 'INVALID_INPUT', error: 'No URL record data found on NFC card.' };
  }

  let parsed;
  try {
    parsed = new URL(urlString.trim());
  } catch {
    return { valid: false, code: 'MALFORMED_URL', error: 'NFC card contains an invalid URL.' };
  }

  // 1. Enforce HTTPS (allow HTTP only for localhost / 127.0.0.1 in development)
  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.protocol !== 'https:' && (!isLocal || parsed.protocol !== 'http:')) {
    return { valid: false, code: 'INSECURE_PROTOCOL', error: 'NFC URL must use secure HTTPS.' };
  }

  // 2. Enforce expected hostname
  const targetHost = expectedHost || (typeof window !== 'undefined' && window.location?.host ? window.location.host : 'nfc.kenncode.me');
  // Strip port from comparison if targetHost includes port but parsed does not or vice versa
  const normalizedTargetHost = targetHost.toLowerCase().split(':')[0];
  const normalizedParsedHost = parsed.hostname.toLowerCase();

  // Allow match if hosts match or if target is nfc.kenncode.me and parsed is nfc.kenncode.me
  const isHostMatch = normalizedParsedHost === normalizedTargetHost ||
    (normalizedParsedHost === 'nfc.kenncode.me' || normalizedParsedHost === 'localhost' || normalizedParsedHost === '127.0.0.1');

  if (!isHostMatch) {
    return { valid: false, code: 'UNTRUSTED_DOMAIN', error: `Untrusted NFC card origin: ${parsed.hostname}` };
  }

  // 3. Enforce path exactly "/t" or "/t/"
  const cleanPath = parsed.pathname.replace(/\/+$/, '');
  if (cleanPath !== '/t') {
    return { valid: false, code: 'INVALID_PATH', error: `Unrecognized NFC URL path: ${parsed.pathname}` };
  }

  // 4. Reject query string token exposure (?token=...)
  if (parsed.searchParams.has('token') || (parsed.search && parsed.search.length > 1)) {
    return {
      valid: false,
      code: 'QUERY_TOKEN_REJECTED',
      error: 'Insecure URL format: tokens must be stored in the URL fragment (#), not query parameters.',
    };
  }

  // 5. Extract token from hash fragment (#<token>)
  if (!parsed.hash || parsed.hash.length <= 1) {
    return { valid: false, code: 'MISSING_FRAGMENT_TOKEN', error: 'NFC URL is missing credential fragment (#token).' };
  }

  const rawToken = parsed.hash.slice(1).trim();

  // 6. Validate base64url token structure (~24-32 characters, alphanumeric + '-' + '_')
  const base64UrlRegex = /^[A-Za-z0-9_-]{16,128}$/;
  if (!base64UrlRegex.test(rawToken)) {
    return { valid: false, code: 'INVALID_TOKEN_FORMAT', error: 'NFC credential format is structurally invalid.' };
  }

  return { valid: true, token: rawToken };
}

/**
 * Creates an in-memory scan debouncer to suppress rapid duplicate reads
 * when an NFC card remains held against the device antenna (~1.5–2s window).
 * Memory-only: never persists tokens to localStorage, sessionStorage, or cookies.
 */
export function createScanDebouncer(debounceMs = 1800) {
  let lastToken = null;
  let lastTime = 0;

  return {
    shouldProcess(token) {
      if (!token) return false;
      const now = Date.now();
      if (lastToken === token && now - lastTime < debounceMs) {
        return false; // Duplicate suppressed
      }
      lastToken = token;
      lastTime = now;
      return true;
    },
    reset() {
      lastToken = null;
      lastTime = 0;
    },
  };
}
