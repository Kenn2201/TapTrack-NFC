# TapTrack NFC — Versioning & Release Policy

TapTrack NFC follows [Semantic Versioning](https://semver.org/).

## Source of Truth

    client/src/constants/version.js

## Synced Release Files

1. `client/src/constants/version.js`
2. `package.json`
3. `CHANGELOG.md`
4. `VERSIONING.md`
5. `README.md`

## Pre-1.0 Rules

| Type | Description |
|------|-------------|
| PATCH | Bug fixes and small maintenance changes |
| MINOR | New functionality, API routes, NFC features or UI workflows |

## Current Status

- **Released Baseline**: `v0.3.0 ALPHA` (Release: `v0.3.0`, Branch: `master`)
- **Previous Release**: `v0.2.0 ALPHA`
- **Production Release Candidate**: `v0.4.0 ALPHA` (Deployed on `master`; physical Android Web NFC NDEFReader test pending)
- **Active Development**: `v0.9.0 RC (Manual Testing Pending)` (Branch: `kenn/develop`)
- **Milestone Scope**: Public testing, physical-card inventory visibility, compatibility, and benchmark support

## Locked Release Roadmap

| Version | Stage | Deliverable | Status |
|---------|-------|-------------|--------|
| v0.1.0 | ALPHA | Foundation architecture + initial UI | Released |
| v0.2.0 | ALPHA | Authentication, roles, users, responsive profiles, Resend | Released |
| v0.3.0 | ALPHA | NFC provisioning, card assignment, token generation, NFC Tools workflow | Released |
| v0.4.0 | ALPHA | Android Web NFC reader with NDEFReader | RC / Validation Pending |
| v0.5.0 | ALPHA | Universal NFC URL /t#token fallback | Complete; iPhone physical test passed |
| v0.6.0 | BETA | Events, attendance sessions, shared attendance engine | Complete |
| v0.7.0 | BETA | Admin dashboard + complete card lifecycle (lost/revoke/replace/disable) | Complete |
| v0.8.0 | BETA | Mobile UX, Activity Pulse, audit logs, accessibility/security hardening | Complete |
| v0.9.0 | RC | Public friend testing preparation + 20-card inventory + QR/NFC benchmarking | Manual Testing Pending |
| v1.0.0 | LIVE | Stable public TapTrack NFC demo | Planned |

## Release Stages

| Stage | Description |
|-------|-------------|
| ALPHA | Core development |
| BETA | Feature-complete enough for public testing |
| RC | Release candidate |
| LIVE | Stable public release |

## Required Checks

```bash
npm test
npm run build
git status
```

- No secrets
- No private data
- No unrelated project terminology
