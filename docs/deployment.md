# TapTrack NFC — Production Deployment

This document is the production checklist for the existing TapTrack deployment:

- Frontend: Vercel — `https://nfc.kenncode.me`
- Backend: Render — `https://api.nfc.kenncode.me`
- Database: Neon PostgreSQL
- Transactional email: Resend

Do not commit real environment values to Git.

## Backend / Render

Recommended Render service settings:

| Setting | Value |
|---|---|
| Root directory | `server` |
| Runtime | Node.js |
| Node version | 22 |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check | `/health` |

The API also runs migrations when started directly with `node src/server.js`, so a dashboard start command that bypasses `npm start` still executes the Drizzle migration gate.

### Required backend environment variables

| Variable | Production value / rule |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon PostgreSQL connection string; keep SSL enabled in the Neon URL |
| `CLIENT_URL` | `https://nfc.kenncode.me` |
| `NFC_DOMAIN` | `https://nfc.kenncode.me` |
| `JWT_SECRET` | long random secret; never reuse another secret |
| `CARD_TOKEN_PEPPER` | different long random secret; **never rotate casually** because existing physical card credentials depend on it |
| `AUTO_MIGRATE` | `true` (optional because true is the default) |
| `RESEND_API_KEY` | Resend API key when production email is enabled |
| `RESEND_FROM_EMAIL` | `TapTrack NFC <no-reply@mail.nfc.kenncode.me>` after the sending domain is verified |
| `JWT_EXPIRES_IN` | optional, defaults to `7d` |
| `LOG_LEVEL` | optional, normally `info` |

Do **not** manually set `PORT` on Render unless the service requires it; Render supplies the listening port.

## Frontend / Vercel

Recommended Vercel project settings:

| Setting | Value |
|---|---|
| Root directory | `client` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

### Frontend environment variables

Only this application variable is required:

| Variable | Production value |
|---|---|
| `VITE_API_URL` | `https://api.nfc.kenncode.me/api` |

Never place `DATABASE_URL`, `JWT_SECRET`, `CARD_TOKEN_PEPPER`, or `RESEND_API_KEY` in Vercel client environment variables. Any `VITE_*` variable is bundled into browser-visible code.

## Neon

No additional TapTrack application environment variables are stored in Neon. Neon provides the `DATABASE_URL` value used by Render.

Use the same production database currently used by TapTrack. Do not create a replacement database for this release.

## Automatic Drizzle migrations

TapTrack now runs Drizzle migrations **before the API begins listening**.

The Drizzle ledger lives under:

```text
server/drizzle/
  0000_v1_2_event_visibility.sql
  0001_v1_2_card_requests.sql
  0002_v1_2_public_feedback.sql
  meta/_journal.json
```

These map to the existing project migrations:

| Drizzle migration | Existing project migration |
|---|---|
| `0000_v1_2_event_visibility.sql` | `008_v1.2.0_event_visibility.sql` |
| `0001_v1_2_card_requests.sql` | `009_v1.2.0_card_requests.sql` |
| `0002_v1_2_public_feedback.sql` | `010_v1.2.0_public_feedback.sql` |

Migration 007 is deliberately **not** in the Drizzle ledger because it is already applied to production Neon and must not be rerun.

The SQL for 008–010 is idempotent so a database where one of those migrations was already applied manually can still be adopted by the Drizzle ledger safely.

### Deployment safety

- A PostgreSQL advisory lock serializes migration startup between concurrent API instances.
- The API starts only after all pending migrations succeed.
- Migration 009 refuses to create the one-ACTIVE-card unique index if legacy duplicate ACTIVE cards exist.
- Migration 009 does **not** alter, revoke, replace, or repair those cards automatically.
- NFC-001 must never be used for destructive lifecycle QA.
- If migration startup fails, inspect the Render deployment logs before changing production data.

Emergency-only override:

```text
AUTO_MIGRATE=false
```

Use that only to temporarily start the API without running pending migrations. It is not the normal production setting.

## DNS / external service checks

- `nfc.kenncode.me` should resolve to the Vercel frontend.
- `api.nfc.kenncode.me` should resolve to the Render API.
- The Resend sending domain used by `RESEND_FROM_EMAIL` must be verified in Resend/DNS before real email delivery can succeed.

## Production QA gate

After a successful deploy:

1. Confirm `GET https://api.nfc.kenncode.me/health` returns status `ok` and version `1.2.0`.
2. Confirm the Drizzle deploy completed in Render logs.
3. Perform event/public-vs-invite-only QA.
4. Perform NFC request/one-active-card QA with disposable cards only.
5. Regression-test the already validated iPhone NFC URL flow.
6. Perform Android physical NDEFReader/Web NFC acceptance separately.
7. Test auth/account archive and public/authenticated feedback.
8. Test desktop/iPhone/small-Android responsive UI.
9. Keep the release labeled `v1.2.0 RC` until human QA is accepted.
