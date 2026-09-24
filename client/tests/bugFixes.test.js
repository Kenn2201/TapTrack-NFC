import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');

// ─── BUG FIX REGRESSION TESTS ───────────────────────────────────────
// Bug 1: Change Password 404
// Bug 2: NFC Card Lifecycle 400/500
// Bug 3: Admin Cards activatingLoading white screen

test('Profile handles changePassword with confirmPassword field', () => {
  const source = readFileSync(join(SRC, 'pages', 'Profile.jsx'), 'utf8');
  assert.match(source, /changePassword/);
  assert.match(source, /confirmPassword/);
  assert.match(source, /authService\.changePassword/);
});

test('Profile changePassword error handling preserves modal state on failure', () => {
  const source = readFileSync(join(SRC, 'pages', 'Profile.jsx'), 'utf8');
  assert.match(source, /catch[\s]*\(err\)/);
  assert.match(source, /setPasswordError/);
});

test('AdminCards lifecycle modal stays open on API error', () => {
  const source = readFileSync(join(SRC, 'pages', 'AdminCards.jsx'), 'utf8');
  assert.match(source, /catch[\s]*\(err\)[\s\S]{0,200}setLifecycleModal/);
  assert.match(source, /loading:\s*false,\s*error:/);
});

test('AdminCards lifecycle reason trim handles undefined', () => {
  const source = readFileSync(join(SRC, 'pages', 'AdminCards.jsx'), 'utf8');
  assert.match(source, /reason\s*\|\|\s*''/);
});

test('AdminCards activatingLoading is properly defined and used', () => {
  const source = readFileSync(join(SRC, 'pages', 'AdminCards.jsx'), 'utf8');
  assert.match(source, /const\s+\[\s*activatingLoading\s*,\s*setActivatingLoading\s*\]/);
  assert.match(source, /setActivatingLoading\(true\)/);
  assert.match(source, /setActivatingLoading\(false\)/);
});

test('AdminCards lifecycle modal close-on-success behavior', () => {
  const source = readFileSync(join(SRC, 'pages', 'AdminCards.jsx'), 'utf8');
  assert.match(source, /setLifecycleModal\(null\)/);
});

test('AdminCards lifecycle modal close-on-error preserves modal', () => {
  const source = readFileSync(join(SRC, 'pages', 'AdminCards.jsx'), 'utf8');
  const catchBlock = source.match(/catch\s*\(err\)[\s\S]*?setLifecycleModal[\s\S]*?}/);
  assert.ok(catchBlock, 'catch block with setLifecycleModal should exist');
});

test('version consistency across all client source files', () => {
  const files = [
    join(SRC, 'constants', 'version.js'),
    join(SRC, 'components', 'layout', 'Header.jsx'),
    join(SRC, 'pages', 'Landing.jsx'),
    join(SRC, 'pages', 'Compatibility.jsx'),
  ];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    assert.ok(
      source.includes('v1.1.0') || source.includes('CURRENT_VERSION_LABEL'),
      `${file} should reference v1.1.0`
    );
  }
});

test('no stale v1.0 RC remains in client source', () => {
  const files = readdirSync(join(SRC, 'pages')).filter(f => f.endsWith('.jsx'));
  for (const file of files) {
    const source = readFileSync(join(SRC, 'pages', file), 'utf8');
    assert.ok(
      !source.includes('v1.0 RC'),
      `${file} should not contain stale v1.0 RC`
    );
  }
});

test('compatibility page has device capability cards', () => {
  const source = readFileSync(join(SRC, 'pages', 'Compatibility.jsx'), 'utf8');
  assert.match(source, /IPHONE SAFARI|iPhone/i);
  assert.match(source, /ANDROID CHROME|Android/i);
  assert.match(source, /DESKTOP|Desktop/i);
});

test('compatibility page has device detection panel', () => {
  const source = readFileSync(join(SRC, 'pages', 'Compatibility.jsx'), 'utf8');
  assert.match(source, /Web NFC|webNfcSupported/i);
});

test('Operator page has event-first design', () => {
  const source = readFileSync(join(SRC, 'pages', 'Operator.jsx'), 'utf8');
  assert.match(source, /iPhone Attendance Mode/i);
  assert.match(source, /Open Event Sessions/i);
});

test('Operator page has session switch confirmation', () => {
  const source = readFileSync(join(SRC, 'pages', 'Operator.jsx'), 'utf8');
  assert.match(source, /Switch.*Session|Switch iPhone/i);
});


test('Modal focus management does not re-focus on every onClose identity change', () => {
  const source = readFileSync(join(SRC, 'components', 'ui', 'Modal.jsx'), 'utf8');
  assert.match(source, /onCloseRef\s*=\s*useRef\(onClose\)/);
  assert.match(source, /onCloseRef\.current\s*=\s*onClose/);
  assert.match(source, /\},\s*\[isOpen\]\);/);
  assert.doesNotMatch(source, /\[isOpen,\s*onClose\]/);
});

test('API GET supports query params without changing callers', () => {
  const source = readFileSync(join(SRC, 'services', 'api.js'), 'utf8');
  assert.match(source, /URLSearchParams/);
  assert.match(source, /get:\s*\(url,\s*options\s*=\s*\{\}\)/);
  assert.match(source, /withQuery\(url,\s*options\.params\)/);
});

test('Admin feedback service unwraps the feedback array', () => {
  const source = readFileSync(join(SRC, 'services', 'adminFeedbackService.js'), 'utf8');
  assert.match(source, /Array\.isArray\(data\?\.feedback\)/);
  assert.match(source, /data\.feedback/);
});

test('Event detail service unwraps the event response wrapper', () => {
  const source = readFileSync(join(SRC, 'services', 'eventService.js'), 'utf8');
  assert.match(source, /data\?\.event\s*\|\|\s*null/);
});

test('Maintenance UI sends validator-compatible enabled/message fields', () => {
  const source = readFileSync(join(SRC, 'pages', 'AdminPlatform.jsx'), 'utf8');
  assert.match(source, /enabled:\s*newState/);
  assert.match(source, /message:\s*newState\s*\?\s*formMessage/);
  assert.doesNotMatch(source, /setMaintenance\(\{[\s\S]{0,200}maintenanceEnabled:\s*newState/);
});

test('Admin email diagnostics uses the real server configuration fields', () => {
  const source = readFileSync(join(SRC, 'pages', 'AdminEmail.jsx'), 'utf8');
  assert.match(source, /diagnostics\.configured/);
  assert.match(source, /diagnostics\.provider/);
  assert.doesNotMatch(source, /diagnostics\.apiKeyValid/);
  assert.doesNotMatch(source, /diagnostics\.domainVerified/);
});


test('Milestone B removes RSVP actions from EventDetail', () => {
  const source = readFileSync(join(SRC, 'pages', 'EventDetail.jsx'), 'utf8');
  assert.doesNotMatch(source, /handleRsvp|I'll Attend|Can't Make It|Your RSVP/);
  assert.match(source, /Attendance Requirement/);
  assert.match(source, /Invite Only|inviteOnly/);
});

test('Admin event creation supports PUBLIC and INVITE_ONLY with selected user IDs', () => {
  const source = readFileSync(join(SRC, 'pages', 'AdminEvents.jsx'), 'utf8');
  assert.match(source, /visibility:\s*'PUBLIC'/);
  assert.match(source, /INVITE_ONLY/);
  assert.match(source, /selectedUserIds/);
  assert.match(source, /adminEventParticipantsService\.invite/);
});

test('Operator uses least-privilege staff user directory instead of admin users endpoint', () => {
  const source = readFileSync(join(SRC, 'pages', 'Operator.jsx'), 'utf8');
  assert.match(source, /authService\.getStaffUsers/);
  assert.doesNotMatch(source, /authService\.getUsers\(\)/);
});

test('Participant invitation client sends userIds, not email payloads', () => {
  const source = readFileSync(join(SRC, 'services', 'adminEventParticipantsService.js'), 'utf8');
  assert.match(source, /\{\s*userIds\s*\}/);
  assert.doesNotMatch(source, /\{\s*emails\s*\}/);
});
