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

test('all admin surfaces share the administration workspace navigation', () => {
  for (const page of ['AdminDashboard.jsx', 'AdminUsers.jsx', 'AdminCards.jsx', 'AdminEvents.jsx', 'AuditLogs.jsx', 'AdminFeedback.jsx', 'AdminEmail.jsx', 'AdminPlatform.jsx']) {
    assert.match(read('pages', page), /AdminWorkspaceNav/, `${page} missing AdminWorkspaceNav`);
  }
});
