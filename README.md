# TapTrack NFC

> Mobile-first NFC card and attendance technology demonstration.

TapTrack NFC is an independent proof-of-concept for exploring NFC-based identity
and attendance workflows using standard NDEF-compatible NFC cards.

**Current Version: v0.1.0 ALPHA**

## Features

- NFC card provisioning
- Web NFC reader mode
- Universal NDEF URL fallback
- Card assignment
- Card verification
- Revocation
- Replacement
- Event attendance
- Attendance sessions
- User profiles
- Activity metrics
- Administrative dashboard
- Audit history
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
| Validation | Zod |
| Tests | Vitest + Supertest |

## Getting Started

```bash
# Clone
git clone <repo-url>
cd project-6-nfc

# Install
cd client && npm install
cd ../server && npm install

# Environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Database
psql -f database/schema.sql
psql -f database/seed.sql

# Dev
cd client && npm run dev   # Frontend on :5173
cd server && npm run dev   # Backend on :3001
```

## NFC Modes

**Mode A — Web NFC** (Android Chrome): Direct `NDEFReader.scan()` for instant attendance.

**Mode B — NFC URL** (iPhone / fallback): Card contains `https://nfc.kenncode.me/t#<credential>`, OS opens browser, app resolves credential.

## License

MIT
