# TapTrack NFC Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - Release Candidate (pending human acceptance)
**Release Name:** SaaS Pass — Release Candidate

### Added

#### Production Repair + UX Pass (v1.1.0 RC)
- **Landing terminology glossary** - plain-English explanations for opaque credentials, HMAC-SHA256 derivation, CARD_TOKEN_PEPPER, card lifecycle states, and related security terms
- **Login redesign** - branded sign-in with minimum 44-48px touch targets, session security copy (HttpOnly cookies), Create Account / Forgot Password links
- **Auth initialization screen** - branded TapTrack icon with NFC pulse while the session is being secured (reduced-motion aware)
- **Route reveal transitions** - subtle fade/slide on navigation for all routes (prefers-reduced-motion aware)
- **Profile redesign** - circular avatar with initials fallback, Edit Profile modal (first/last name, nickname, birthday, avatar URL), friendly birthday display, Member ID labeling
- **My Card UX** - corrected terminology ("opaque random NFC credential"); NFC setup/replacement request workflow that reuses the feedback pipeline without credential recovery
- **Dashboard attendance rate** - friendly pending state ("Not enough eligible events yet") with plain-English explanation instead of a bare N/A
- **Admin Events redesign** - Create Event modal (name, dates, location, description) with timezone context, clickable event cards showing invites/attendance/session state, event detail modal, lifecycle-gated attendance-session actions
- **Admin Users details** - clickable user rows/cards with a user detail modal (identity, role, status, verification, registration/last-login dates)
- **Audit Logs redesign** - humanized action labels, Who/Action/Target/When columns, filters (action, actor, date), detail modal with sanitized metadata, CSV/JSON/Markdown export
- **Event lifecycle reconciliation** - deterministic scheduled status transitions (pre-open state preserved, OPEN inside the scheduled window, CLOSED after end; CANCELLED and manually CLOSED events are never auto-reopened); lazy and idempotent, never creates attendance sessions
- **Responsive hardening** - `env(safe-area-inset-*)` support and mobile overflow guards for tables/pre blocks
- **Benchmark route guard regression test** - static test proving `/operator/benchmark` remains nested inside the OPERATOR/ADMIN guard

#### Platform Maintenance
- **Public maintenance status endpoint** (`GET /api/platform/maintenance-status`) - accessible without authentication for health checks and client polling
- **Admin maintenance toggle** (`POST /api/admin/platform/maintenance`) - enable/disable maintenance mode with optional custom message
- **Maintenance mode enforcement** - non-admin API requests receive HTTP 503 with maintenance message when enabled
- **Admin bypass** - authenticated ADMIN users retain full API access during maintenance
- **Client maintenance screen** - dedicated page showing maintenance status, custom message, and retry/check buttons

#### Feedback System
- **User Feedback Center** (`POST /api/feedback`) - authenticated users can submit feedback with category (Bug/Feature/Improvement/Other), 1-5 star rating, message, page context, and reproduction steps
- **Admin feedback triage** (`GET /api/feedback`, `PATCH /api/admin/feedback/:id/status`) - admins can list, filter, and update status (New/In Review/Accepted/Rejected/Implemented)
- **Audit logging** - all feedback submissions and status changes are logged
- **Feedback categories** - Bug Report, Feature Request, Improvement, Other with visual icons

#### Email Suite (Admin)
- **Direct email** (`POST /api/admin/emails/send`) - send single email to specific recipient with HTML/text body
- **Broadcast email** (`POST /api/admin/emails/broadcast`) - send to all active users with mandatory confirmation checkbox
- **Diagnostics endpoint** (`GET /api/admin/emails/diagnostics`) - verify Resend API key, domain verification, and connectivity
- **Rate limiting** - per-endpoint rate limits to prevent abuse
- **Audit logging** - all email operations logged with actor and metadata

#### Event Participants & RSVP
- **Admin invite participants** (`POST /api/admin/events/:id/participants/invite`) - invite multiple users by email to events
- **Admin list participants** (`GET /api/admin/events/:id/participants`) - view all invited participants with status
- **User RSVP** (`POST /api/events/:id/participants/rsvp`) - invited users can Accept/Decline
- **Participant status tracking** - Invited / Accepted / Declined with visual badges
- **Audit logging** - invitations and RSVPs logged with actor and metadata

#### NFC Card Reissue
- **Reissue endpoint** (`POST /api/admin/cards/:id/reissue`) - invalidate existing card, generate new credential, preserve user assignment
- **Replace endpoint** (`POST /api/admin/cards/:id/replace`) - replace card with new label, generate new credential
- **Reissue schema** - requires confirmation of invalidation and optional reason
- **Audit logging** - reissue/replace operations logged with old/new card IDs and reasons

#### Profile & Security Enhancements
- **Nickname field** - optional display name for attendance rosters
- **Birthday field** - optional date of birth
- **Avatar URL field** - optional profile image URL
- **Change password** (`POST /api/users/me/password`) - change current password with current password verification, invalidates other sessions
- **Enhanced profile update** (`PATCH /api/users/me`) - supports nickname, birthday, avatarUrl alongside first/last name

#### Operator Workspace (Existing - Enhanced)
- Event-first workflow: select session first, then perform operations
- Manual attendance entry with user dropdown
- iPhone Attendance Mode - keep session open for multiple NFC taps
- NFC Web Scanner for Android Chrome
- Real-time recent scans display with deduplication
- Session close with confirmation

#### NFC Reader (Existing)
- Web NFC (Android Chrome) with credential verification
- iPhone NFC URL fallback (`/t#token`) for universal links
- Manual attendance fallback
- Scan result display with card info and attendance record
- Recent scans history with status badges (Success/Duplicate/Error)

#### Card Lifecycle (Existing)
- Provision physical cards with opaque random credentials
- Card states: UNASSIGNED → ACTIVE → LOST/REVOKED/DISABLED → REPLACED
- Card replacement preserves user assignment and audit history
- Zero PII on physical cards - only opaque random URL fragments

#### Infrastructure
- Shared attendance engine (`AttendanceService.record`) for NFC_WEB, NFC_URL, MANUAL methods
- Centralized card lifecycle service with validated state transitions
- Rate limiting per endpoint (auth, attendance, nfc, password reset)
- HttpOnly cookie authentication with session_version for single-active-session enforcement
- Comprehensive audit logging with secret sanitization

### Changed
- **Version bump** to 1.1.0 across client and server
- **Database migration 007** (`007_v1.1.0_saas_pass.sql`) - additive schema for feedback, email, event participants, platform settings tables
- **Routes reorganized** - SaaS features grouped under dedicated sections
- **Admin dashboard** - new navigation for Feedback, Email, Platform, Participants

### Fixed
- Auth fingerprint: login 500 fixed, test-fake session_version parity, admin-list parity, recordLogin parity
- Auth test suite: 25/25 passing
- Full server test suite: 153/153 passing (including event lifecycle reconciliation suite)
- Client test suite: 59/59 passing
- Client build: green
- Lint: resolved unused variable, JSX key, and unused catch binding warnings in touched files
- Event list payload now also exposes location, participant count, and open-session state

### Security
- Zero raw NFC credentials ever stored (only SHA-256 hashes)
- Session_version bumped on password/role/status changes
- Disabled users lose access immediately
- HttpOnly cookies, no JWT in response body
- Resend API keys never exposed to client
- Audit metadata sanitized (passwords, tokens, secrets stripped)
- Maintenance mode enforced server-side (not client-only)
- Broadcast email requires explicit confirmation checkbox

### Physical Test Status
- **NFC-001** (Android NFC_WEB): PASSED
- **NFC-001** (iPhone NFC_URL): PASSED (public `/t`, authenticated NFC_URL check-in, duplicate detection)
- **NFC-001** (Android NDEFReader): PENDING
- Manual attendance: VERIFIED

---

## [1.0.0] - 2024-XX-XX (Previous Release)

### Added
- Initial NFC attendance engine
- User authentication with HttpOnly cookies
- Admin user management (roles, status)
- Event/session management
- NFC card provisioning and lifecycle
- Web NFC (Android) + iPhone NFC_URL + Manual attendance
- Card lifecycle states
- Audit logging
- Operator console with manual attendance
- NFC reader with Web NFC support

---

## Versioning Policy

- **PATCH**: Bug fix, documentation fix, small config correction
- **MINOR**: New feature, new route, new API, new NFC capability, new dashboard feature
- **MAJOR**: Reserved for stable post-1.0 breaking changes

### Release Stages
- `v0.x.x` ALPHA
- `v0.x.x` BETA
- `v0.x.x` RC
- `v1.x.x` PRODUCTION CANDIDATE (until manual acceptance)

**Never mark a v1 candidate LIVE before human acceptance testing passes.**

### Required Release Files (synchronized on every release)
1. `client/src/constants/version.js`
2. `package.json` (root)
3. `client/package.json`
4. `server/package.json`
5. `CHANGELOG.md`
6. `README.md`

---

*Generated as part of TapTrack NFC v1.1.0 Release Candidate — SaaS Pass*