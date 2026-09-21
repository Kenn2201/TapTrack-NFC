# TapTrack NFC

> Mobile-first NFC card provisioning and attendance technology proof-of-concept.

TapTrack NFC is an independent proof-of-concept for exploring NFC-based identity
and attendance workflows using standard NDEF-compatible NFC cards.

**Current Version: v0.1.0 ALPHA**

## Planned Features

> v0.1.0 establishes the project foundation and architecture.
> Features below are scaffolded and will be implemented across future releases.

- NFC card provisioning and lifecycle management
- Web NFC reader mode (Android Chrome via NDEFReader)
- Universal NDEF URL fallback (iPhone / unsupported browsers)
- Card assignment, verification, revocation, and replacement
- Event attendance with operator-managed sessions
- User profiles and Activity Pulse metrics
- Role-based access (Admin, Operator, User)
- Administrative dashboard and audit history
- Responsive mobile-first interface

## Technology

| Layer | Stack |
|-------|-------|
| Frontend | React 19 + Vite |
| UI | Tailwind CSS v4 |
| Routing | React Router |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | HttpOnly-cookie session / JWT |
| NFC | Web NFC NDEFReader + URL/NDEF fallback |
| Email | Resend |
| Validation | Zod |
| Tests | Vitest + Supertest |

## Getting Started

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/TapTrack-NFC.git
cd TapTrack-NFC

# Install
cd client && npm install
cd ../server && npm install
```

## Environment Setup

TapTrack NFC separates browser-safe configuration from private server credentials.

### Server

Create `server/.env` using `.env.example` as reference:

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DATABASE_URL=postgresql://user:password@localhost:5432/taptrack_nfc

NFC_DOMAIN=https://nfc.kenncode.me

# Prepared for v0.2.0 — not used in v0.1.0
JWT_SECRET=replace_with_generated_secret
JWT_EXPIRES_IN=7d

# Prepared for v0.3.0 — not used in v0.1.0
CARD_TOKEN_PEPPER=replace_with_different_generated_secret

# Prepared for v0.2.0 — not used in v0.1.0
RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=TapTrack NFC <no-reply@mail.nfc.kenncode.me>
```

### Generate Secrets

Generate `JWT_SECRET`:

```powershell
node -e "const c=require('crypto'); console.log('JWT_SECRET=' + c.randomBytes(32).toString('base64url'))"
```

Generate `CARD_TOKEN_PEPPER` (must be different from JWT_SECRET):

```powershell
node -e "const c=require('crypto'); console.log('CARD_TOKEN_PEPPER=' + c.randomBytes(32).toString('base64url'))"
```

Example output (fake values — never use these):

```text
JWT_SECRET=aB3xY9_example_not_real_value
CARD_TOKEN_PEPPER=zK7wQ2_different_example_value
```

**Never reuse the same value for both secrets.**

### Client

Create `client/.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
```

Only browser-safe configuration belongs in `VITE_` variables. These must **never** use `VITE_` prefix:

- `DATABASE_URL`
- `JWT_SECRET`
- `CARD_TOKEN_PEPPER`
- `RESEND_API_KEY`

### Resend (v0.2.0+)

The planned sender domain is `mail.nfc.kenncode.me`, verified through Resend.

Sender: `TapTrack NFC <no-reply@mail.nfc.kenncode.me>`

For development testing, fictional Yopmail accounts may be used as **recipients only**. Never use Yopmail as a sender domain. Never include real personal data in test accounts.

### Database

Local PostgreSQL:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/taptrack_nfc
```

Hosted providers (e.g. Neon) will supply their own connection string.

### Verify Secrets Are Ignored

```powershell
git check-ignore -v server/.env
git check-ignore -v client/.env.local
git status
```

Neither real environment file should appear as a tracked file.

### Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |
| Health check | http://localhost:3001/health |
| API base | http://localhost:3001/api |
| Production frontend | https://nfc.kenncode.me |
| Production API | https://api.nfc.kenncode.me/api |

## NFC Modes

**Mode A — Web NFC** (Android Chrome): Direct `NDEFReader.scan()` for instant attendance.

**Mode B — NFC URL** (iPhone / fallback): Card contains `https://nfc.kenncode.me/t#<credential>`, OS opens browser, app resolves credential.

## Release Roadmap

| Version | Stage | Deliverable |
|---------|-------|-------------|
| v0.1.0 | ALPHA | Foundation architecture + initial UI |
| v0.2.0 | ALPHA | Authentication, roles, users, Resend |
| v0.3.0 | ALPHA | NFC provisioning, token generation |
| v0.4.0 | ALPHA | Android Web NFC reader |
| v0.5.0 | ALPHA | Universal NFC URL fallback |
| v0.6.0 | BETA | Attendance engine |
| v0.7.0 | BETA | Admin dashboard + card lifecycle |
| v0.8.0 | BETA | Mobile UX, audit, security hardening |
| v0.9.0 | RC | Public testing + physical cards |
| v1.0.0 | LIVE | Stable public demo |

## License

MIT
