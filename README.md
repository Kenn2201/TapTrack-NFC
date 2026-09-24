# TapTrack NFC — NFC Attendance Technology Demo

> **A mobile-first NFC attendance technology proof-of-concept exploring reusable physical NFC credentials as an extension/alternative to parts of traditional QR-code and manual attendance workflows.**

[![Version](https://img.shields.io/badge/version-1.2.0%20RC-blue)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)](package.json)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()

---

## Why TapTrack Exists

Traditional attendance workflows rely on:
- **Paper sign-in sheets** — slow, error-prone, no real-time data
- **QR codes on screens** — require phone unlock, camera permission, good lighting, network connectivity
- **Manual entry by operators** — single point of failure, bottleneck at entry

**TapTrack NFC** explores a different approach: **physical, reusable NFC cards** that members tap to record attendance instantly. No phone unlock, no camera, no network latency — just tap and go.

### QR/Manual Comparison

| Aspect | QR Code | Manual Entry | TapTrack NFC |
|--------|---------|--------------|--------------|
| **Speed** | 3-5 sec (unlock + scan) | 10-15 sec (operator) | **<1 sec (tap)** |
| **Hardware** | Any phone with camera | Operator tablet/phone | NTAG215 card + phone |
| **Network** | Required | Required | Optional (cached) |
| **Privacy** | Camera access | Operator sees all | No camera, no PII on card |
| **Durability** | Screen damage = fail | N/A | **Waterproof card** |
| **Cost** | Free | Labor | ~$0.50/card (NTAG215) |

---

## How It Works

### Three Acquisition Methods

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATTENDANCE ACQUISITION                        │
├──────────────────┬────────────────────┬────────────────────────┤
│   NFC WEB        │   NFC URL          │   MANUAL                 │
│   (Android*)     │   (iPhone / All)   │   (Operator)             │
├──────────────────┼────────────────────┼────────────────────────┤
│ Web NFC API      │ Universal Link     │ Operator selects         │
│ Chrome 89+       │ `/t#<token>`       │ user from dropdown       │
│ Android 10+      │ Opens in Safari    │ Records attendance       │
│ Requires HTTPS   │ No app install     │ Requires OPERATOR/ADMIN  │
└──────────────────┴────────────────────┴────────────────────────┘
```

*Android Web NFC is implemented for compatible Chromium browsers; physical NDEFReader acceptance remains pending.*

All three methods converge on the **same shared attendance engine** (`AttendanceService.record`):
- Resolves user/card identity
- Validates session (open, event match, user active)
- Enforces uniqueness (DB constraint → `ALREADY_RECORDED`)
- Creates audit log
- Returns attendance record

### NFC Credential Model

**Never store PII on the card.** Physical NTAG215 tags contain only:
```
https://nfc.kenncode.me/t#<opaque-random-token>
```

The token is a cryptographically random string. The server stores only a **SHA-256 hash** of the token. On tap:
1. Client reads URL from tag
2. Client sends token fragment to `/nfc/check-in` (Web NFC) or `/nfc/check-in/url` (NFC URL)
3. Server hashes token, looks up card, validates status, records attendance

**Card Lifecycle States:**
```
UNASSIGNED → ACTIVE → { LOST, REVOKED, DISABLED } → REPLACED
                              ↳ REPLACED (terminal)
```

- **Never delete** issued cards — revoke/replace preserves audit history
- **Reissue** invalidates old credential, generates new one, preserves user assignment
- **Replace** assigns new label, generates new credential, preserves user assignment

### Event & Session Architecture

```
Event (OPEN/CLOSED/CANCELLED)
    │
    └── Session (OPEN/CLOSED)
            │
            ├── NFC_WEB check-in
            ├── NFC_URL check-in
            └── MANUAL check-in (OPERATOR/ADMIN)
```

- Events define the **what/when/where**
- Sessions define the **attendance window** (opened/closed by OPERATOR/ADMIN)
- Attendance records link: User + Session + Event + Method + Timestamp

### Roles

| Role | Capabilities |
|------|--------------|
| **USER** | View profile, submit feedback, view public/invited events, own card/requests, and attendance history |
| **OPERATOR** | Open/close sessions, manual attendance, NFC scanner, iPhone mode |
| **ADMIN** | All operator + user management, card provisioning, events, audit logs, platform maintenance, email suite, feedback triage |

### Event Visibility & Attendance Expectations

- **PUBLIC:** visible to active users; no RSVP; attendance is optional check-in. Not attending does not lower Attendance Rate.
- **INVITE_ONLY:** administrators select required participants. Invited users are expected to attend; attendance is evaluated after the event closes.
- **Attendance Rate:** attended closed invite-only required events ÷ closed invite-only events the user was invited to.
- If there are no eligible required events, the UI shows **No required events yet**.


---

## Security Model

### Authentication
- **HttpOnly cookies only** — JWT never in response body, never in localStorage
- **Session versioning** — `session_version` bumped on password/role/status changes, enforces single active session
- **Disabled users** — immediately lose access (middleware checks status on every request)
- **Password hashing** — bcrypt with configurable cost

### NFC Credentials
- **Zero PII on physical cards** — only opaque random URL fragment (`/t#<token>`)
- **Token hashing** — server stores SHA-256(token) only
- **Fragment privacy** — URL fragment (`#token`) never sent to server in access logs
- **Card states** — ACTIVE cards only; LOST/REVOKED/DISABLED/REPLACED rejected

### Audit & Privacy
- **Sanitized metadata** — passwords, tokens, secrets, keys stripped from audit logs
- **Structured audit entries** — actor, action, entity, metadata, timestamp
- **No mutation API** — audit service is append-only

### Rate Limiting
- Auth endpoints: 5 req/min (login, register, password reset)
- Attendance: 30 req/min
- NFC verify/resolve: 60 req/min
- Password reset: 3 req/hour

---

## Physical Hardware

### Tested Cards
| Card | Standard | Memory | Test Status |
|------|----------|--------|-------------|
| **NTAG215** | NFC Forum Type 2, ISO 14443-3A | 504 bytes | iPhone NFC URL PASSED; Android Web NFC physical validation PENDING |
| NTAG213 | NFC Forum Type 2 | 144 bytes | Compatible |
| NTAG216 | NFC Forum Type 2 | 888 bytes | Compatible |

**NFC-001** — Primary physical validation card. iPhone public verification, authenticated NFC URL attendance, and duplicate-tap handling have passed. Physical Android NDEFReader/Web NFC validation remains pending. NFC-001 must not be automatically rotated, reissued, replaced, rewritten, or lifecycle-modified.

### Infrastructure
- **Server**: Node.js 20+, Express 5, PostgreSQL (pg)
- **Client**: React 19, Vite 8, Tailwind CSS 4
- **Email**: Resend (transactional)
- **Auth**: JWT in HttpOnly cookie, bcrypt
- **Database**: PostgreSQL with migrations
- **Deployment**: Docker-ready, Neon-compatible

---

## Project Structure

```
project-6-nfc/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/                  # Base components (Button, Input, Card, Modal, etc.)
│   │   │   ├── layout/              # Header, Footer
│   │   │   ├── attendance/          # AttendanceResult, Scanner
│   │   │   └── cards/               # CardStatusBadge
│   │   ├── pages/                   # Route pages
│   │   │   ├── Profile.jsx          # Profile edit (nickname, birthday, avatar, password)
│   │   │   ├── FeedbackCenter.jsx   # User feedback submission
│   │   │   ├── AdminFeedback.jsx    # Admin feedback triage
│   │   │   ├── AdminPlatform.jsx    # Maintenance mode toggle
│   │   │   ├── AdminEmail.jsx       # Email suite (direct/broadcast/diagnostics)
│   │   │   ├── AdminEvents.jsx      # Event management
│   │   │   ├── AdminCards.jsx       # Card provisioning, lifecycle, reissue
│   │   │   ├── EventDetail.jsx      # Event info and required participants
│   │   │   ├── Operator.jsx         # Operator console
│   │   │   ├── NfcReaderPage.jsx    # Web NFC scanner
│   │   │   ├── MaintenanceScreen.jsx # Maintenance mode UX
│   │   │   └── ... (auth, dashboard, etc.)
│   │   ├── services/                # API clients
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── hooks/useAttendanceContext.jsx # Shared attendance state
│   │   ├── hooks/useNFC.jsx         # Web NFC hook
│   │   └── constants/version.js     # Version constants
│   └── package.json
│
├── server/                          # Express API server
│   ├── src/
│   │   ├── controllers/             # Route handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── card.controller.js
│   │   │   ├── event.controller.js
│   │   │   ├── attendance.controller.js
│   │   │   ├── platform.controller.js
│   │   │   ├── feedback.controller.js
│   │   │   ├── email.controller.js
│   │   │   ├── eventParticipants.controller.js
│   │   │   └── ...
│   │   ├── services/                # Business logic
│   │   │   ├── auth.service.js
│   │   │   ├── cardLifecycle.service.js
│   │   │   ├── attendance.service.js
│   │   │   ├── platform.service.js
│   │   │   ├── feedback.service.js
│   │   │   ├── email.service.js
│   │   │   ├── eventParticipants.service.js
│   │   │   └── ...
│   │   ├── repositories/            # Database access
│   │   ├── middleware/              # Auth, roles, validation, rate limiting
│   │   ├── validators/schemas.js    # Zod schemas
│   │   ├── routes/index.js          # Route definitions
│   │   ├── config/                  # Configuration
│   │   └── server.js                # Entry point
│   ├── tests/                       # Vitest test suites
│   │   ├── auth.test.js
│   │   ├── attendance.test.js
│   │   ├── cardLifecycle.test.js
│   │   ├── hardening.test.js
│   │   ├── nfcCard.test.js
│   │   ├── nfcResolve.test.js
│   │   ├── nfcUrlCheckIn.test.js
│   │   └── nfcVerify.test.js
│   ├── database/migrations/
│   │   └── 007_v1.1.0_saas_pass.sql
│   └── package.json
│
├── CHANGELOG.md
├── README.md
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Neon cloud)
- npm 10+

### Installation

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL, JWT_SECRET, RESEND_API_KEY, etc.

# Run migrations
cd server && npm run migrate

# Start development servers
# Terminal 1: Server
cd server && npm run dev

# Terminal 2: Client
cd client && npm run dev
```

### Environment Variables (server/.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/taptrack

# Auth
JWT_SECRET=your-256-bit-secret
JWT_ISSUER=taptrack-nfc
JWT_AUDIENCE=taptrack-nfc-client
SESSION_COOKIE_NAME=taptrack_session
NODE_ENV=development

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com

# App
APP_URL=http://localhost:5173
API_URL=http://localhost:3000
```

### Running Tests

```bash
# Server tests (128 tests)
cd server && npm test

# Client tests
cd client && npm test

# Client lint
cd client && npm run lint

# Client build
cd client && npm run build
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login (sets HttpOnly cookie) |
| POST | `/api/auth/logout` | User | Logout (clears cookie) |
| GET | `/api/auth/me` | User | Current user profile |
| POST | `/api/auth/verify-email` | Public | Verify email token |
| POST | `/api/auth/resend-verification` | Public | Resend verification |
| POST | `/api/auth/forgot-password` | Public | Request password reset |
| POST | `/api/auth/reset-password` | Public | Reset password with token |
| PATCH | `/api/users/me` | User | Update profile (name, nickname, birthday, avatar) |
| POST | `/api/users/me/password` | User | Change password (invalidates other sessions) |

### Admin Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | ADMIN | List all users |
| GET | `/api/admin/users/:id` | ADMIN | Get user by ID |
| PATCH | `/api/admin/users/:id/role` | ADMIN | Update user role |
| PATCH | `/api/admin/users/:id/status` | ADMIN | Update user status |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | User | List events |
| GET | `/api/events/:id` | User | Get event detail |
| POST | `/api/admin/events` | ADMIN | Create event |
| PATCH | `/api/admin/events/:id` | ADMIN | Update event |

### Attendance (Shared Engine)
| Method | Endpoint | Auth | Method |
|--------|----------|------|--------|
| POST | `/api/nfc/check-in` | OPERATOR/ADMIN | NFC_WEB |
| POST | `/api/nfc/check-in/url` | OPERATOR/ADMIN | NFC_URL |
| POST | `/api/attendance/manual` | OPERATOR/ADMIN | MANUAL |
| POST | `/api/nfc/verify` | OPERATOR/ADMIN | Verify card token |
| POST | `/api/nfc/resolve` | Public* | Resolve card to user |
| GET | `/api/sessions/open` | OPERATOR/ADMIN | List open sessions |
| POST | `/api/events/:id/sessions` | OPERATOR/ADMIN | Open session |
| POST | `/api/sessions/:id/close` | OPERATOR/ADMIN | Close session |

* `/nfc/resolve` supports optional authentication for public card lookup

### NFC Cards
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me/card` | User | Get own card |
| GET | `/api/admin/cards` | ADMIN | List all cards |
| GET | `/api/admin/cards/:id` | ADMIN | Get card by ID |
| POST | `/api/admin/cards` | ADMIN | Provision new card |
| POST | `/api/admin/cards/provision` | ADMIN | Provision (alias) |
| PATCH | `/api/admin/cards/:id/activate` | ADMIN | Activate after physical write |
| PATCH | `/api/admin/cards/:id/assign` | ADMIN | Assign/reassign user |
| POST | `/api/admin/cards/:id/assign` | ADMIN | Assign (alias) |
| PATCH | `/api/admin/cards/:id/lifecycle` | ADMIN | Transition status |
| POST | `/api/admin/cards/:id/reissue` | ADMIN | Reissue (invalidate old, new credential) |
| POST | `/api/admin/cards/:id/replace` | ADMIN | Replace with new label |

### Platform Maintenance
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/platform/maintenance-status` | Public | Check maintenance status |
| POST | `/api/admin/platform/maintenance` | ADMIN | Toggle maintenance mode |

### Feedback
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/feedback` | User | Submit feedback |
| GET | `/api/feedback` | ADMIN | List feedback (with status filter) |
| PATCH | `/api/admin/feedback/:id/status` | ADMIN | Update feedback status |

### Email Suite
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/emails/send` | ADMIN | Send direct email |
| POST | `/api/admin/emails/broadcast` | ADMIN | Broadcast to all active users |
| GET | `/api/admin/emails/diagnostics` | ADMIN | Run Resend diagnostics |

### Event Participants
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/events/:id/participants/invite` | ADMIN | Add required participants to an invite-only event |
| GET | `/api/admin/events/:id/participants` | ADMIN/OPERATOR | List required participants |
| GET | `/api/users/me/card-requests` | User | View own NFC setup/replacement requests |
| POST | `/api/users/me/card-requests` | User | Create NFC setup/replacement request |
| GET | `/api/admin/card-requests` | ADMIN | Review NFC card request queue |

---

## Database Migrations

Migrations are stored in `database/migrations/` and are production-controlled.

- **007 — v1.1.0 SaaS pass:** already applied to production Neon. **Do not rerun it.**
- **008 — event visibility:** adds `PUBLIC` / `INVITE_ONLY` events. Existing events default to `PUBLIC`.
- **009 — card requests / one-active-card guard:** adds the dedicated setup/replacement queue and a unique database guard for one ACTIVE NFC card per user.
- **010 — public feedback:** permits anonymous feedback rows while authenticated feedback remains associated with the submitting account.

Migrations 008, 009, and 010 must be applied before full production QA of their dependent v1.2 features. Migration 009 deliberately stops if legacy duplicate ACTIVE cards exist; resolve those lifecycle states manually rather than auto-modifying card history.

No test, CI job, or client flow should auto-apply production migrations.

---

## Version Synchronization

Release `v1.2.0 RC` is synchronized across:

| File | Version |
|------|---------|
| `client/src/constants/version.js` | `1.2.0` |
| `client/package.json` | `1.2.0` |
| `server/package.json` | `1.2.0` |
| `CHANGELOG.md` | `[1.2.0]` entry |
| `VERSIONING.md` | `v1.2.0 RC` |

**Release State:** Release Candidate — manual QA pending.

Current v1.2 work includes the public/invite-only event model, required-event Attendance Rate, NFC setup/replacement request queue, one-active-card safety guard, shared authenticated/admin/auth shells, theme/What's New/legal surfaces, profile account archiving, public feedback, compatibility improvements, and expanded administration workflows.

---

## Release Checklist

- [x] Server test suite → 14/14 files, 181/181 tests passed in GitHub Actions
- [x] Client test suite → 82/82 tests passed in GitHub Actions
- [x] Client production build → passed
- [x] Client lint → 0 errors (24 warnings remain for later cleanup)
- [x] npm audit (server/client) → 0 vulnerabilities
- [ ] Apply migration 008 to production Neon before invite-only QA
- [ ] Apply migration 009 to production Neon before card-request/one-active-card QA
- [ ] Apply migration 010 to production Neon before anonymous public-feedback QA
- [ ] Human QA for v1.2.0 RC
- [ ] Android physical NDEFReader acceptance
- [ ] Merge `kenn/develop` → `master` only after QA approval
- [ ] **Do not tag, do not create GitHub Release, do not mark LIVE before acceptance**

---

## Glossary (Plain English)

| Term | Meaning |
|------|---------|
| **NFC** | Near Field Communication — short-range wireless (few cm) |
| **NTAG215** | A specific NFC chip type (Type 2, ~500 bytes writable) |
| **Web NFC** | Browser API (Chrome on Android) to read/write NFC tags |
| **NFC URL** | Universal link (`/t#token`) that opens app/website when tag tapped |
| **MANUAL** | Operator types/selects user to record attendance |
| **Opaque token** | Random string with no inherent meaning; only server knows mapping |
| **Session version** | Counter incremented when user changes password/role; invalidates old sessions |
| **HttpOnly cookie** | Cookie inaccessible to JavaScript; prevents XSS theft |
| **SHA-256** | Cryptographic hash function; one-way, collision-resistant |
| **Audit log** | Sanitized administrative activity history showing who did what and when |
| **Rate limiting** | Max requests per time window per IP/user |
| **Migration** | Versioned SQL script to evolve database schema |
| **NTAG215** | NFC Forum Type 2 tag, 504 bytes user memory, 7-byte UID |

---

## Physical Validation Status

| Test | Method | Status |
|------|--------|--------|
| NFC-001 public tap | iPhone Safari NFC URL verification | **PASSED** — safe resolve only, no attendance |
| NFC-001 authenticated tap | iPhone Safari NFC URL attendance | **PASSED** |
| NFC-001 duplicate tap | Same session duplicate protection | **PASSED** — Already Recorded, no duplicate row |
| Android physical scan | Web NFC / NDEFReader | **PENDING** |
| Manual attendance | Operator console | Verified by automated workflow tests; human v1.2 QA still pending |

Do not claim physical Android NDEFReader/Web NFC as passed until that acceptance test is completed.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [NFC Tools](https://nfc-tools.mobi/) — for physical card testing
- [Resend](https://resend.com/) — transactional email
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Vitest](https://vitest.dev/) — testing
- [Zod](https://zod.dev/) — schema validation

---

**TapTrack NFC** — Demonstration project. Not a production system. Use at your own risk.