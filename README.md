# TapTrack NFC

TapTrack NFC is a generic public NFC attendance technology demo. The current build is **v1.0.0 — Production Candidate; Manual Acceptance Pending**. It is not marked LIVE and has no v1.0 tag or release yet.

## Capabilities

- Secure authentication with `ADMIN`, `OPERATOR`, and `USER` roles.
- Event creation and operator-managed attendance sessions.
- One shared attendance engine for `NFC_WEB`, authenticated `NFC_URL`, and `MANUAL` check-ins.
- NFC provisioning and lifecycle states: `UNASSIGNED`, `ACTIVE`, `LOST`, `REVOKED`, `REPLACED`, and `DISABLED`.
- Real admin metrics, member attendance history, Activity Pulse, and read-only audit logs.
- NFC-001–NFC-020 inventory visibility, safe device diagnostics, and manual NFC/QR benchmark timing.
- Responsive interfaces with explicit loading, empty, error, unsupported-device, and duplicate states.

## Architecture

```text
React 19 / Vite / Tailwind v4
        │ HTTPS JSON + HttpOnly session cookie
Express route → auth/RBAC/validation → controller → service → repository → PostgreSQL
        │
        └─ NFC credential → card verification → shared attendance service → record → audit
```

Business rules live in services. Repositories own parameterized SQL. Controllers translate HTTP requests and responses. The database enforces one attendance record per user/session.

## NFC security model

Physical cards store only:

```text
https://nfc.kenncode.me/t#<opaque-random-token>
```

- The URL fragment is not sent in the HTTP request line.
- PostgreSQL stores only an HMAC-SHA256 derivation created by `nfcCredentialService.deriveCredentialHash()`.
- Raw credentials are exposed once during provisioning or replacement, remain only in memory/request bodies, and are never logged or stored in browser storage.
- NFC UID, names, emails, roles, database IDs, and attendance history are never written to the card.
- Public `/t` resolution is read-only. Token possession alone cannot create attendance.
- Attendance requires an authenticated `ADMIN` or `OPERATOR` and an open session.

## Roles

| Role | Access |
|---|---|
| ADMIN | Users, events, sessions, cards, lifecycle, dashboard, attendance, and audit viewing |
| OPERATOR | Open/close attendance sessions and record NFC/manual attendance |
| USER | Own profile, card metadata, attendance history, and Activity Pulse |

All authorization is enforced server-side.

## Activity Pulse

- **Total Check-ins:** attendance record count for the user.
- **Events Attended:** distinct attended event count.
- **Attendance Rate:** `N/A` because the application does not yet track a truthful eligibility denominator.
- **Current Streak:** consecutive UTC calendar weeks containing at least one check-in, anchored to the current or immediately previous week.

## Audit logging

Administrative and security-sensitive user, card, event, session, and attendance actions create immutable audit records. Audit metadata is recursively sanitized and excludes passwords, hashes, tokens, credentials, cookies, API keys, and connection strings. Only administrators can read audits; no audit mutation API exists.

## Device compatibility

| Flow | Intended support |
|---|---|
| Universal `/t#token` fallback | iPhone Safari and Android mobile browsers |
| Direct Web NFC | Compatible Android Chromium browsers over HTTPS |
| Desktop | All management features; no direct Web NFC antenna access |
| Unsupported Web NFC | Universal URL or operator manual fallback |

Physical iPhone validation of the v0.5 universal fallback passed with NFC-001. **The v0.4 Android physical `NDEFReader` validation remains pending** and must not be marked complete until performed on compatible hardware.

## Local development

Prerequisites: current Node.js, npm, and PostgreSQL.

```bash
cd server
npm install
npm test
npm start

cd ../client
npm install
npm test
npm run build
npm run dev
```

Copy `.env.example` into local environment configuration and supply private values outside version control. Never commit `.env` files.

## Database migrations

Apply numbered migrations in order using the deployment environment's safe PostgreSQL migration mechanism:

1. `001_v0.2.0_auth_users.sql`
2. `002_v0.3.0_nfc_provisioning.sql`
3. `003_v0.6.0_events_attendance.sql`
4. `004_v0.7.0_card_lifecycle.sql`
5. `005_v0.8.0_audit_logs.sql`

Migrations are additive and preserve issued cards and attendance history. Never run `database/seed.sql` against production.

## Deployment

- Frontend: Vercel at `https://nfc.kenncode.me`
- API: Render at `https://api.nfc.kenncode.me`
- Database: Neon PostgreSQL
- Email: Resend
- Health: `GET https://api.nfc.kenncode.me/health` derives version from `server/package.json`

Production configuration requires the documented environment variables in `.env.example`, including trusted client origin, database connection, JWT secret, NFC credential pepper, and Resend settings.

## Release history

| Version | Stage | Scope | Status |
|---|---|---|---|
| v0.1.0 | ALPHA | Foundation | Released |
| v0.2.0 | ALPHA | Authentication, roles, users, email | Released |
| v0.3.0 | ALPHA | NFC provisioning | Released |
| v0.4.0 | ALPHA | Web NFC reader | Engineering complete; Android physical test pending |
| v0.5.0 | ALPHA | Universal NFC URL fallback | Complete; iPhone physical test passed |
| v0.6.0 | BETA | Events and shared attendance | Complete |
| v0.7.0 | BETA | Admin dashboard and card lifecycle | Complete |
| v0.8.0 | BETA | Activity Pulse, audit, accessibility/security | Complete |
| v0.9.0 | RC | Public testing preparation | Engineering complete; manual testing pending |
| v1.0.0 | Production Candidate | Stabilized public demo | Manual acceptance pending |

## License

MIT
