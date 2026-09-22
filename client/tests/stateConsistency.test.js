import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.jsx')) out.push(p);
  }
  return out;
}

function setStatePairing(source) {
  const setCalls = new Set(
    [...source.matchAll(/\bset[A-Z]\w*\s*\(/g)]
      .map(m => m[0].replace(/\s*\($/, ''))
      .filter(n => n !== 'setTimeout' && n !== 'setInterval'),
  );
  const declared = new Set(
    [...source.matchAll(/\bconst\s+\[\s*\w+\s*,\s*(set[A-Z]\w*)\s*\]/g)].map(m => m[1]),
  );
  return { setCalls, declared };
}

test('every setState call in JSX files has a matching useState declaration', () => {
  const files = walk(SRC);
  assert.ok(files.length > 0, 'expected at least one JSX file under src/');
  const problems = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const { setCalls, declared } = setStatePairing(source);
    for (const name of setCalls) {
      if (!declared.has(name)) {
        problems.push(`${file}: ${name} used but not declared`);
      }
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('AdminCards declares activatingLoading state (Bug 3 regression guard)', () => {
  const source = readFileSync(join(SRC, 'pages', 'AdminCards.jsx'), 'utf8');
  assert.match(source, /const\s+\[\s*activatingLoading\s*,\s*setActivatingLoading\s*\]/);
  assert.match(source, /setActivatingLoading\(false\)/);
});

test('no hardcoded v1.0 RC remains in client source', () => {
  const files = walk(SRC);
  const offenders = files.filter(f => readFileSync(f, 'utf8').includes('v1.0 RC'));
  assert.deepEqual(offenders, []);
});

test('version.js declares CURRENT_VERSION 1.1.0 and matching RC label', async () => {
  const mod = await import('../src/constants/version.js');
  assert.equal(mod.CURRENT_VERSION, '1.1.0');
  assert.equal(mod.CURRENT_VERSION_LABEL, 'v1.1.0 RC');
  assert.equal(mod.CURRENT_VERSION_STAGE, 'RC');
});

test('client package.json version matches CURRENT_VERSION', async () => {
  const pkg = JSON.parse(readFileSync(join(SRC, '..', 'package.json'), 'utf8'));
  const mod = await import('../src/constants/version.js');
  assert.equal(pkg.version, mod.CURRENT_VERSION);
});

test('Header imports and uses CURRENT_VERSION_LABEL', () => {
  const source = readFileSync(join(SRC, 'components', 'layout', 'Header.jsx'), 'utf8');
  assert.match(source, /import\s+\{\s*CURRENT_VERSION_LABEL\s*\}\s+from\s+'\.\.\/\.\.\/constants\/version'/);
  assert.match(source, /\{CURRENT_VERSION_LABEL\}/);
});

test('no page hardcodes version labels instead of the shared constant', () => {
  const files = walk(SRC);
  const offenders = files.filter((f) => /v1\.\d+\.\d+(?:\s+RC)?/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(offenders, []);
});

test('/operator/benchmark is protected by the OPERATOR/ADMIN route guard (direct navigation blocked)', () => {
  const source = readFileSync(join(SRC, 'App.jsx'), 'utf8');
  const operatorGuard = source.indexOf("allowedRoles={['OPERATOR', 'ADMIN']}");
  assert.ok(operatorGuard !== -1, 'OPERATOR/ADMIN guard must be declared');
  const afterOperatorGuard = source.slice(operatorGuard);
  assert.ok(
    afterOperatorGuard.includes('/operator/benchmark'),
    '/operator/benchmark must be nested inside the OPERATOR/ADMIN guard'
  );
  const adminGuard = afterOperatorGuard.indexOf("allowedRoles={['ADMIN']}");
  const benchmarkInBlock = afterOperatorGuard.indexOf('/operator/benchmark');
  assert.ok(
    adminGuard === -1 || benchmarkInBlock < adminGuard,
    '/operator/benchmark must not sit inside the ADMIN-only guard block'
  );
});
