# TapTrack NFC — Versioning and Release Policy

TapTrack NFC follows Semantic Versioning. The canonical runtime version is `server/package.json`; the client label in `client/src/constants/version.js`, both package files, README, CHANGELOG, and this file must remain synchronized.

## Current status

- Version: `1.2.0`
- Label: `v1.2.0 RC`
- Release name: `Event & Product Workflow Pass — Release Candidate`
- Acceptance: `Production QA Ready — Human QA Pending`
- Development branch: `kenn/develop`
- Production branch: `master`
- No `v1.2.0` tag or GitHub Release is permitted until human QA/acceptance passes.

## Database gate

- Migration 007: already applied to production Neon. **Do not rerun it.**
- Migrations 008, 009, and 010 are now adopted by the Drizzle runtime ledger in `server/drizzle/`.
- Render/API startup automatically runs pending Drizzle migrations before listening when `AUTO_MIGRATE` is not `false`.
- Migration 009 still refuses to continue if duplicate legacy ACTIVE cards exist; it never auto-modifies lifecycle history.
- CI validates the Drizzle chain against an isolated PostgreSQL service. CI never points at production Neon.
- Human production QA begins only after the main/master deployment starts successfully with the migrated schema.

## History

| Version | Stage | Deliverable | Status |
|---|---|---|---|
| v0.1.0 | ALPHA | Foundation architecture and initial UI | Released |
| v0.2.0 | ALPHA | Authentication, roles, users, email integration | Released |
| v0.3.0 | ALPHA | NFC provisioning and assignment | Released |
| v0.4.0 | ALPHA | Android Web NFC reader | Engineering complete; physical Android validation pending |
| v0.5.0 | ALPHA | Universal NFC URL fallback | Complete; iPhone physical validation passed |
| v0.6.0 | BETA | Events, sessions, shared attendance engine | Complete |
| v0.7.0 | BETA | Admin metrics and card lifecycle | Complete |
| v0.8.0 | BETA | Activity Pulse, audits, UX and security hardening | Complete |
| v0.9.0 | RC | Public testing, inventory, compatibility, timing-tool preparation | Engineering complete |
| v1.0.0 | Production Candidate | Stabilized public TapTrack NFC demo | Manual acceptance pending |
| v1.1.0 | RC | SaaS and production-repair pass | Superseded by v1.2 RC |
| v1.2.0 | RC | Event model, NFC request workflow, one-active-card guard, product/admin UX | Manual QA pending |

## Release rules

- PATCH: compatible bug, documentation, or small configuration correction.
- MINOR: backward-compatible feature or workflow addition.
- MAJOR: intentionally incompatible behavior or contract change.
- A release candidate may be deployed for validation, but it must remain labeled RC until human acceptance.
- Do not call a release LIVE solely because automated tests pass.
