import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBenchmarkResult, getSafeDiagnostics } from '../src/utils/testingTools.js';

test('benchmark calculates ordered NFC timings', () => {
  assert.deepEqual(buildBenchmarkResult({ method: 'NFC', startedAt: 100, resolvedAt: 250, recordedAt: 400 }), { method: 'NFC', resolutionMs: 150, recordingMs: 150, totalMs: 300 });
});
test('benchmark rejects incomplete or reversed timing', () => assert.throws(() => buildBenchmarkResult({ method: 'QR', startedAt: 100, resolvedAt: 90, recordedAt: 200 })));
test('safe diagnostics exclude credentials and browser storage', () => {
  const report = getSafeDiagnostics('v0.9.0', { navigator: { platform: 'test', onLine: true }, isSecureContext: true, innerWidth: 390, innerHeight: 844 });
  assert.equal(report.webNfcSupported, false); assert.equal(report.viewport, '390x844');
  assert.equal(JSON.stringify(report).includes('token'), false); assert.equal(JSON.stringify(report).includes('cookie'), false);
});
