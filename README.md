# TapTrack NFC

> Mobile-first NFC card provisioning and attendance technology proof-of-concept.

TapTrack NFC is an independent proof-of-concept for exploring NFC-based identity
and attendance workflows using standard NDEF-compatible NFC cards.

**Current Release: v0.1.0 ALPHA**
**Current Development Milestone: v0.2.0 ALPHA (In Development)**

## Architecture & Verified Infrastructure

```text
User Browser                   cron-job.org
      |                             |
      v                             | GET /health (every 10m)
nfc.kenncode.me                     v
Vercel / React 19 / Vite ──> api.nfc.kenncode.me
                             Render / Express Web Service
                                    |
                                    +------> Neon PostgreSQL
                                    |
                                    +------> Resend
                                              |
                                              v
                                      mail.nfc.kenncode.me
```

- **Frontend (`https://nfc.kenncode.me`)**: Deployed on Vercel with Vite + React 19 and Tailwind CSS v4. Active TLS/HTTPS.
- **Backend API (`https://api.nfc.kenncode.me`)**: Deployed on Render as a long-running Node.js/Express Web Service. Active TLS/HTTPS.
- **Deployment Health**: `GET /health` operational and tested via HTTPS and credentialed browser fetch.
- **Database**: Hosted Neon PostgreSQL with serverless connection pooling via `DATABASE_URL`.
- **Transactional Email**: Sending domain `mail.nfc.kenncode.me` configured and verified in Resend with DKIM/SPF records.
- **Development Milestone**: Application-level v0.2.0 authentication, users, roles, and transactional email flows are implemented on `kenn/develop` and undergoing verification.

## Planned Features

> v0.1.0 established the foundation architecture and initial UI.
> v0.2.0 implements authentication, roles, users, responsive profiles, and Resend (undergoing validation on `kenn/develop`).
> NFC hardware workflows and attendance engines will be implemented across future releases.

- NFC card provisioning and lifecycle management (v0.3.0+)
- Web NFC reader mode (Android Chrome via NDEFReader) (v0.4.0)
- Universal NDEF URL fallback (iPhone / unsupported browsers) (v0.5.0)
- Card assignment, verification, revocation, and replacement (v0.3.0 / v0.7.0)
- Event attendance with operator-managed sessions (v0.6.0)
- User profiles and Activity Pulse metrics (v0.2.0 / v0.8.0)
- Role-based access (Admin, Operator, User) (v0.2.0)
- Administrative dashboard and audit history (v0.7.0 / v0.8.0)
- Responsive mobile-first interface (v0.2.0+)

## Technology

| Layer | Stack |
|-------|-------|
| Frontend | React 19 + Vite |
| UI | Tailwind CSS v4 |
| Routing | React Router |
| Backend | Node.js + Express |
| Database | PostgreSQL (Neon / Local) |
| Auth | HttpOnly-cookie session / JWT |
| NFC | Web NFC NDEFReader + URL/NDEF fallback |
| Email | Resend |
| Validation | Zod |
| Tests | Vitest + Supertest |

## Getting Started

```bash
# Clone
git clone https://github.com/Kenn2201/TapTrack-NFC.git
cd TapTrack-NFC

# Install
cd client && npm install
cd ../server && npm install
```

## Backend Deployment — Render

The TapTrack NFC backend runs as a standard long-running Node.js Web Service on Render:

- **Service Type**: Web Service
- **Runtime**: Node.js
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`
- **Custom Domain**: `api.nfc.kenncode.me`

Render dynamically injects `PORT`, and the server automatically binds to `process.env.PORT`. All production secrets are configured securely in Render's environment settings.

### Render Health Check & Keep-Alive

Production health endpoint:

```text
GET https://api.nfc.kenncode.me/health
```

Example response:

```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

> [!NOTE]
> During the released `v0.1.0` baseline, the version reports `0.1.0`. Once `v0.2.0` is deployed to production, it will report `0.2.0`.

The current free Render Web Service is monitored by an external cron-job.org job:

```text
Job:      TapTrack Render Keep Alive
Schedule: Every 10 minutes
Cron:     */10 * * * *
Timezone: Asia/Manila
Target:   https://api.nfc.kenncode.me/health
Method:   GET
Expected: HTTP 200
```

#### Operational Details

- **Warm Instances**: Periodically exercises the lightweight public health endpoint to reduce idle cold starts during development and demo use.
- **Availability Monitoring**: Provides an external uptime check with automated failure and recovery notifications via cron-job.org.
- **Infrastructure Only**: This keep-alive job is purely operational infrastructure. The TapTrack NFC application does not depend on cron-job.org for business logic. If the job is paused or removed, the free Render instance will simply sleep when idle and perform a standard cold start upon the next incoming request.

## Environment Setup

TapTrack NFC strictly separates browser-visible configuration from private server credentials.

### Client Configuration

Local development (`client/.env.local`):

```env
VITE_API_URL=http://localhost:3001/api
```

Production browser configuration (configured in Vercel):

```env
VITE_API_URL=https://api.nfc.kenncode.me/api
```

> [!NOTE]
> `VITE_*` environment variables are bundled into client-side JavaScript by Vite and are visible in browser requests. Never place server secrets, database URLs, or API keys in `VITE_*` variables.

### Server Configuration

Local development (`server/.env`):

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/taptrack_nfc
NFC_DOMAIN=https://nfc.kenncode.me
JWT_SECRET=replace_with_generated_secret
JWT_EXPIRES_IN=7d
CARD_TOKEN_PEPPER=replace_with_different_generated_secret
RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=TapTrack NFC <no-reply@mail.nfc.kenncode.me>
```

Production configuration (configured in Render environment settings — variable names only):

```env
PORT (assigned dynamically by Render)
NODE_ENV=production
CLIENT_URL=https://nfc.kenncode.me
NFC_DOMAIN=https://nfc.kenncode.me
DATABASE_URL=<Neon PostgreSQL connection string>
JWT_SECRET=<production secret>
JWT_EXPIRES_IN=7d
CARD_TOKEN_PEPPER=<different production secret>
RESEND_API_KEY=<production Resend key>
RESEND_FROM_EMAIL=TapTrack NFC <no-reply@mail.nfc.kenncode.me>
```

> [!IMPORTANT]
> Never commit actual Render or production environment values. Real secrets are configured directly in Render environment settings.

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

### Resend Email

The verified sending domain is `mail.nfc.kenncode.me`, managed via Resend.

Sender: `TapTrack NFC <no-reply@mail.nfc.kenncode.me>`

For development testing, fictional Yopmail accounts may be used as **recipients only**. Never use Yopmail as a sender domain. Never include real personal data in test accounts.

### Database

Local PostgreSQL:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/taptrack_nfc
```

Production uses Neon serverless PostgreSQL with connection pooling. The database layer remains provider-neutral and communicates standardly over `DATABASE_URL`.

### Verify Secrets Are Ignored

```powershell
git check-ignore -v server/.env
git check-ignore -v client/.env.local
git status
```

Neither real environment file should appear as a tracked file.

### Service URLs

| Service | Environment | URL |
|---------|-------------|-----|
| Frontend | Local | http://localhost:5173 |
| Backend | Local | http://localhost:3001 |
| Health Check | Local | http://localhost:3001/health |
| API Base | Local | http://localhost:3001/api |
| Production Frontend | Live | https://nfc.kenncode.me |
| Production API | Live | https://api.nfc.kenncode.me/api |
| Production Health Check | Live | https://api.nfc.kenncode.me/health |

## NFC Modes

**Mode A — Web NFC** (Android Chrome): Direct `NDEFReader.scan()` for instant attendance.

**Mode B — NFC URL** (iPhone / fallback): Card contains `https://nfc.kenncode.me/t#<credential>`, OS opens browser, app resolves credential.

## Release Roadmap

| Version | Stage | Deliverable | Status |
|---------|-------|-------------|--------|
| v0.1.0 | ALPHA | Foundation architecture + initial UI | Released |
| v0.2.0 | ALPHA | Authentication, roles, users, responsive profiles, Resend | In Development |
| v0.3.0 | ALPHA | NFC provisioning, card assignment, token generation, NFC Tools workflow | Planned |
| v0.4.0 | ALPHA | Android Web NFC reader with NDEFReader | Planned |
| v0.5.0 | ALPHA | Universal NFC URL /t#token fallback | Planned |
| v0.6.0 | BETA | Events, attendance sessions, shared attendance engine | Planned |
| v0.7.0 | BETA | Admin dashboard + complete card lifecycle (lost/revoke/replace/disable) | Planned |
| v0.8.0 | BETA | Mobile UX, Activity Pulse, audit logs, accessibility/security hardening | Planned |
| v0.9.0 | RC | Public friend testing + 20 physical cards + QR/NFC benchmarking | Planned |
| v1.0.0 | LIVE | Stable public TapTrack NFC demo | Planned |

## License

MIT
