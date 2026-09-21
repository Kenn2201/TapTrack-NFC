# Changelog

All notable changes to TapTrack NFC will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased] — v0.2.0 ALPHA (In Development)

### Production Infrastructure (Completed)
- **Frontend Hosting (Vercel)**: Production frontend deployed at `https://nfc.kenncode.me` with Vite + React 19.
- **Backend Hosting (Render)**: Production Express API deployed as a Web Service at `https://api.nfc.kenncode.me`.
- **Deployment Health Check**: Production `GET /health` verified operational with HTTP 200.
- **HTTPS & Custom Domains**: Active TLS and verified DNS on both `nfc.kenncode.me` and `api.nfc.kenncode.me`.
- **CORS & Credentials**: Browser fetch requests from `https://nfc.kenncode.me` to `https://api.nfc.kenncode.me` manually verified with `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`.
- **Database (Neon PostgreSQL)**: Hosted serverless PostgreSQL with connection pooling connected to Render backend via `DATABASE_URL`.
- **Email Domain Verification (Resend)**: `mail.nfc.kenncode.me` fully verified with DKIM, SPF, and CNAME records for outbound transactional email.
- **Environment Split**: Established clean separation between Vercel public browser configuration (`VITE_API_URL`) and Render private server environment variables.

### Application Features (In Development / Planned for v0.2.0)
- User registration with email normalization, password hashing, and duplicate protection.
- HttpOnly cookie session management (`taptrack_session`) with SameSite policy.
- Generic login responses preventing account enumeration.
- Account status enforcement (active vs. disabled).
- Safe user serialization (`/api/auth/me`).
- Secure email verification via random hashed tokens and Resend templates.
- Secure password reset via random hashed tokens and Resend templates.
- Role-based authorization middleware (ADMIN, OPERATOR, USER).
- Admin user management endpoints and role promotion controls.
- Responsive mobile-first user dashboard and profile pages.

## [0.1.0] - 2026-09-21 — Initial Architecture (ALPHA)

### Added

- Initial React 19 / Vite frontend architecture.
- Tailwind CSS v4 integration.
- React Router page structure.
- Node.js / Express API structure.
- PostgreSQL schema plan.
- Generic role hierarchy (Admin, Operator, User, Public).
- NFC card lifecycle design (Unassigned, Active, Lost, Revoked, Replaced, Disabled).
- Web NFC compatibility strategy with NDEFReader feature detection.
- NDEF URL fallback design for iPhone/unsupported browsers.
- Shared attendance-service architecture.
- Public-repository privacy policy (AGENTS.md).
- Semantic Versioning release protocol.
- Documentation stubs (architecture, nfc-flow, card-lifecycle, compatibility).
