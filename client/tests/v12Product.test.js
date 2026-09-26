import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');
const read = (...parts) => readFileSync(join(SRC, ...parts), 'utf8');

test('v1.2 exposes public release, terminology, privacy, and terms routes', () => {
  const source = read('App.jsx');
  for (const route of ['/changelog', '/terminology', '/privacy', '/terms']) {
    assert.ok(source.includes(`path="${route}"`), `missing ${route}`);
  }
});

test('theme provider persists only a non-sensitive TapTrack theme preference', () => {
  const source = read('hooks', 'useTheme.jsx');
  assert.match(source, /taptrack\.theme/);
  assert.match(source, /light/);
  assert.match(source, /dark/);
  assert.match(source, /system/);
  assert.doesNotMatch(source, /token|credential|password|email/i);
});

test('header version badge opens What\'s New and provides theme control', () => {
  const source = read('components', 'layout', 'Header.jsx');
  assert.match(source, /ReleaseNotesModal/);
  assert.match(source, /releaseNotesOpen/);
  assert.match(source, /taptrack-theme/);
  assert.match(source, /What's New/);
});

test('What\'s New stores version and timestamp only and avoids NFC operator surfaces', () => {
  const source = read('components', 'ReleaseNotesModal.jsx');
  assert.match(source, /taptrack\.whatsNew/);
  assert.match(source, /lastShownAt/);
  assert.match(source, /CURRENT_VERSION/);
  assert.match(source, /'\/t'/);
  assert.match(source, /'\/operator'/);
  assert.doesNotMatch(source, /rawToken|credentialHash|password|sessionId/);
});

test('profile editing is inline and does not fake file-upload storage', () => {
  const source = read('pages', 'Profile.jsx');
  assert.match(source, /editingProfile/);
  assert.match(source, /Save Profile/);
  assert.match(source, /does not currently have profile-image file storage/);
  assert.doesNotMatch(source, /type="file"/);
  assert.doesNotMatch(source, /editModal/);
});

test('compatibility separates passed iPhone flow from pending Android physical QA', () => {
  const source = read('pages', 'Compatibility.jsx');
  assert.match(source, /Physically validated Safari NFC URL workflow/);
  assert.match(source, /No attendance is recorded/);
  assert.match(source, /Already Recorded/);
  assert.match(source, /physical NDEFReader acceptance remains pending/i);
});

test('timing tool explicitly avoids hardware-latency claims', () => {
  const source = read('pages', 'Benchmark.jsx');
  assert.match(source, /Manual NFC \/ QR Timing Tool/);
  assert.match(source, /does not measure radio, tag, antenna, or physical NFC hardware latency/i);
});

test('admin email has editable presets and direct-send preview', () => {
  const source = read('pages', 'AdminEmail.jsx');
  assert.match(source, /EMAIL_PRESETS/);
  assert.match(source, /Account activated/);
  assert.match(source, /Event invitation/);
  assert.match(source, /NFC setup \/ replacement/);
  assert.match(source, /Review Direct Email/);
  assert.match(source, /Confirm & Send/);
});

test('maintenance enable action requires an in-app confirmation modal', () => {
  const source = read('pages', 'AdminPlatform.jsx');
  assert.match(source, /MAINTENANCE_PRESETS/);
  assert.match(source, /confirmEnableOpen/);
  assert.match(source, /Enable Maintenance Mode\?/);
  assert.match(source, /Confirm Maintenance Mode/);
});

test('all admin surfaces are routed through the shared AdminShell', () => {
  const app = read('App.jsx');
  const shell = read('components', 'layout', 'AdminShell.jsx');
  assert.match(app, /AdminShell/);
  assert.match(shell, /AdminWorkspaceNav/);
  for (const page of ['AdminDashboard.jsx', 'AdminUsers.jsx', 'AdminCards.jsx', 'AdminEvents.jsx', 'AuditLogs.jsx', 'AdminFeedback.jsx', 'AdminEmail.jsx', 'AdminPlatform.jsx']) {
    assert.doesNotMatch(read('pages', page), /AdminWorkspaceNav/, `${page} should inherit AdminWorkspaceNav from AdminShell`);
  }
});


test('authenticated routes use a shared workspace shell with desktop and mobile navigation', () => {
  const app = read('App.jsx');
  const shell = read('components', 'layout', 'AuthenticatedShell.jsx');
  assert.match(app, /AuthenticatedShell/);
  assert.match(shell, /TapTrack workspace/);
  assert.match(shell, /TapTrack mobile workspace/);
  assert.match(shell, /\/dashboard/);
  assert.match(shell, /\/events/);
  assert.match(shell, /\/attendance/);
  assert.match(shell, /\/my-card/);
});

test('auth routes use one AuthShell with sign-in and register segments', () => {
  const app = read('App.jsx');
  const shell = read('components', 'layout', 'AuthShell.jsx');
  assert.match(app, /AuthShell/);
  assert.match(shell, /Sign In/);
  assert.match(shell, /Register/);
  assert.match(shell, /Secure account recovery/);
});

test('registration and forgot-password forms include non-focusable honeypot fields', () => {
  for (const page of ['Register.jsx', 'ForgotPassword.jsx']) {
    const source = read('pages', page);
    assert.match(source, /name="website"/);
    assert.match(source, /tabIndex=\{-1\}/);
    assert.match(source, /autoComplete="off"/);
  }
});

test('profile exposes archive, not hard-delete, and requires explicit ARCHIVE confirmation', () => {
  const source = read('pages', 'Profile.jsx');
  assert.match(source, /Account Archive/);
  assert.match(source, /Type ARCHIVE to confirm/);
  assert.match(source, /authService\.archiveAccount/);
  assert.match(source, /This is not permanent deletion/);
  assert.doesNotMatch(source, /Delete Account/);
});

test('public feedback has its own public route and stricter endpoint', () => {
  const app = read('App.jsx');
  const page = read('pages', 'PublicFeedback.jsx');
  const service = read('services', 'feedbackService.js');
  assert.match(app, /path="\/feedback\/public"/);
  assert.match(page, /Public Feedback/);
  assert.match(page, /rate-limited/i);
  assert.match(service, /\/feedback\/public/);
});

test('landing links terminology instead of embedding the old large glossary and avoids immutable-audit claims', () => {
  const source = read('pages', 'Landing.jsx');
  assert.match(source, /Open Terminology/);
  assert.match(source, /to="\/terminology"/);
  assert.doesNotMatch(source, /TerminologyCard/);
  assert.doesNotMatch(source, /immutable audit/i);
  assert.match(source, /Android Web NFC is implemented/);
  assert.match(source, /physical NDEFReader acceptance still pending/);
});

test('admin feedback supports category/search triage and anonymous public submissions', () => {
  const source = read('pages', 'AdminFeedback.jsx');
  assert.match(source, /categoryFilter/);
  assert.match(source, /Search feedback/);
  assert.match(source, /Anonymous public feedback/);
  assert.match(source, /Anonymous public visitor/);
});


test('public metadata and profile copy avoid unsupported immutable-audit wording', () => {
  const index = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf8');
  const profile = read('pages', 'Profile.jsx');
  assert.doesNotMatch(index, /immutable audit/i);
  assert.match(index, /sanitized audit history/i);
  assert.doesNotMatch(profile, />Immutable</);
});
