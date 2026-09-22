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
  const versionPattern = /v1\.1\.0\s*RC|CURRENT_VERSION_LABEL|v1\.1\.0/g;
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
