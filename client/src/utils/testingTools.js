export function getSafeDiagnostics(version = 'unknown', env = globalThis) {
  const nav = env.navigator || {};
  return {
    appVersion: version,
    capturedAt: new Date().toISOString(),
    platform: nav.userAgentData?.platform || nav.platform || 'unknown',
    online: typeof nav.onLine === 'boolean' ? nav.onLine : null,
    secureContext: Boolean(env.isSecureContext),
    webNfcSupported: typeof env.NDEFReader !== 'undefined',
    viewport: env.innerWidth && env.innerHeight ? `${env.innerWidth}x${env.innerHeight}` : 'unknown',
  };
}

export function buildBenchmarkResult({ method, startedAt, resolvedAt, recordedAt }) {
  if (!['NFC', 'QR'].includes(method)) throw new Error('Benchmark method must be NFC or QR.');
  if (![startedAt, resolvedAt, recordedAt].every(Number.isFinite) || !(startedAt <= resolvedAt && resolvedAt <= recordedAt)) throw new Error('Benchmark timestamps must be complete and ordered.');
  return { method, resolutionMs: resolvedAt - startedAt, recordingMs: recordedAt - resolvedAt, totalMs: recordedAt - startedAt };
}
