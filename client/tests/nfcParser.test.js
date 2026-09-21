import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isWebNFCSupported,
  isSecureContextSupported,
  parseTapTrackUrl,
  createScanDebouncer,
} from '../src/utils/nfcParser.js';

describe('TapTrack NFC v0.4.0 ALPHA — Client Web NFC & URL Parser Test Suite', () => {
  describe('Feature Detection Logic', () => {
    test('isWebNFCSupported returns false in standard Node/SSR environment without window.NDEFReader', () => {
      assert.equal(isWebNFCSupported(), false);
    });

    test('isSecureContextSupported returns true or false gracefully without throwing in Node/SSR', () => {
      assert.doesNotThrow(() => isSecureContextSupported());
    });
  });

  describe('TapTrack URL & Credential Fragment Extraction', () => {
    const validToken = '4nF7-y9_kL02pQmZ1aBcDeFgHiJkLmNo';
    const validUrl = `https://nfc.kenncode.me/t#${validToken}`;

    test('valid HTTPS /t#token URL extracts raw token cleanly', () => {
      const result = parseTapTrackUrl(validUrl);
      assert.equal(result.valid, true);
      assert.equal(result.token, validToken);
    });

    test('valid localhost URL with port is accepted for local development', () => {
      const localhostUrl = `http://localhost:5173/t#${validToken}`;
      const result = parseTapTrackUrl(localhostUrl, 'localhost:5173');
      assert.equal(result.valid, true);
      assert.equal(result.token, validToken);
    });

    test('trailing slashes on path /t/ are handled gracefully', () => {
      const trailingSlashUrl = `https://nfc.kenncode.me/t/#${validToken}`;
      const result = parseTapTrackUrl(trailingSlashUrl);
      assert.equal(result.valid, true);
      assert.equal(result.token, validToken);
    });

    test('insecure HTTP protocol on non-localhost domain is rejected', () => {
      const insecureUrl = `http://nfc.kenncode.me/t#${validToken}`;
      const result = parseTapTrackUrl(insecureUrl);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INSECURE_PROTOCOL');
    });

    test('untrusted or malicious domains are rejected', () => {
      const evilUrl = `https://evil-phishing-site.example/t#${validToken}`;
      const result = parseTapTrackUrl(evilUrl);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'UNTRUSTED_DOMAIN');
    });

    test('invalid or unexpected pathname is rejected', () => {
      const wrongPathUrl = `https://nfc.kenncode.me/login#${validToken}`;
      const result = parseTapTrackUrl(wrongPathUrl);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INVALID_PATH');
    });

    test('tokens in query parameters are strictly rejected to prevent access log leakage', () => {
      const queryTokenUrl = `https://nfc.kenncode.me/t?token=${validToken}`;
      const result = parseTapTrackUrl(queryTokenUrl);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'QUERY_TOKEN_REJECTED');
    });

    test('URL with query string is rejected even if hash is present', () => {
      const queryAndHashUrl = `https://nfc.kenncode.me/t?session=123#${validToken}`;
      const result = parseTapTrackUrl(queryAndHashUrl);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'QUERY_TOKEN_REJECTED');
    });

    test('missing hash fragment is rejected', () => {
      const noFragmentUrl = 'https://nfc.kenncode.me/t';
      const result = parseTapTrackUrl(noFragmentUrl);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'MISSING_FRAGMENT_TOKEN');
    });

    test('empty hash fragment (#) is rejected', () => {
      const emptyFragmentUrl = 'https://nfc.kenncode.me/t#';
      const result = parseTapTrackUrl(emptyFragmentUrl);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'MISSING_FRAGMENT_TOKEN');
    });

    test('tokens shorter than 16 characters are rejected as invalid format', () => {
      const shortTokenUrl = 'https://nfc.kenncode.me/t#tooshort';
      const result = parseTapTrackUrl(shortTokenUrl);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INVALID_TOKEN_FORMAT');
    });

    test('tokens containing non-base64url characters are rejected', () => {
      const invalidCharsUrl = 'https://nfc.kenncode.me/t#token!with@special$chars%invalid';
      const result = parseTapTrackUrl(invalidCharsUrl);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'INVALID_TOKEN_FORMAT');
    });

    test('empty or non-string input is rejected safely', () => {
      assert.equal(parseTapTrackUrl(null).valid, false);
      assert.equal(parseTapTrackUrl('').valid, false);
      assert.equal(parseTapTrackUrl(undefined).valid, false);
    });
  });

  describe('In-Memory Ephemeral Scan Debounce', () => {
    test('initial scan passes debouncer', () => {
      const debouncer = createScanDebouncer(1000);
      assert.equal(debouncer.shouldProcess('token-A-1234567890'), true);
    });

    test('immediate duplicate scan within debounce window is suppressed', () => {
      const debouncer = createScanDebouncer(1000);
      assert.equal(debouncer.shouldProcess('token-A-1234567890'), true);
      assert.equal(debouncer.shouldProcess('token-A-1234567890'), false);
      assert.equal(debouncer.shouldProcess('token-A-1234567890'), false);
    });

    test('different token is processed immediately without suppression', () => {
      const debouncer = createScanDebouncer(1000);
      assert.equal(debouncer.shouldProcess('token-A-1234567890'), true);
      assert.equal(debouncer.shouldProcess('token-B-0987654321'), true);
    });

    test('reset clears memory state allowing identical token immediately', () => {
      const debouncer = createScanDebouncer(1000);
      assert.equal(debouncer.shouldProcess('token-A-1234567890'), true);
      assert.equal(debouncer.shouldProcess('token-A-1234567890'), false);
      debouncer.reset();
      assert.equal(debouncer.shouldProcess('token-A-1234567890'), true);
    });
  });
});
