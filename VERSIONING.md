# TapTrack NFC — Versioning and Release Policy

TapTrack NFC follows Semantic Versioning. The canonical runtime version is `server/package.json`; the client label in `client/src/constants/version.js`, both package files, README, CHANGELOG, and this file must remain synchronized.

## Current status

- Version: `1.0.0`
- Label: `v1.0.0 — Production Candidate`
- Acceptance: `Manual Acceptance Pending`
- Development branch: `kenn/develop`
- Production branch: `master`
- No v1.0 tag or GitHub Release is permitted until human acceptance passes.

## History

| Version | Stage | Deliverable | Status |
|---|---|---|---|
| v0.1.0 | ALPHA | Foundation architecture and initial UI | Released |
| v0.2.0 | ALPHA | Authentication, roles, users, Resend | Released |
| v0.3.0 | ALPHA | NFC provisioning and assignment | Released |
| v0.4.0 | ALPHA | Android Web NFC reader | Engineering complete; physical validation pending |
| v0.5.0 | ALPHA | Universal URL fallback | Complete; iPhone physical test passed |
| v0.6.0 | BETA | Events, sessions, shared attendance engine | Complete |
| v0.7.0 | BETA | Admin metrics and complete card lifecycle | Complete |
| v0.8.0 | BETA | Activity Pulse, audits, UX and security hardening | Complete |
| v0.9.0 | RC | Public testing, inventory, compatibility, benchmark preparation | Engineering complete; manual testing pending |
| v1.0.0 | Production Candidate | Stabilized public TapTrack NFC demo | Manual acceptance pending |

## Release rules

- Pre-1.0 PATCH: maintenance and fixes; MINOR: functionality.
- Post-1.0 follows standard Semantic Versioning.
- Never label a build LIVE, tag it, or publish a GitHub Release before required human acceptance.
- Never claim physical Android validation, friend testing, or 20-card testing without the corresponding human test.

## Required checks

Run server tests, client tests, client build and lint, both npm audits, `git diff --check`, privacy scan, secret scan, database migration review, and production smoke verification before release.
