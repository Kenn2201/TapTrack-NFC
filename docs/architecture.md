# TapTrack NFC — Architecture

## System Overview

```
PostgreSQL
    ↕
Node.js / Express REST API
    ↕
React 19 + Vite
    ↕
NFC Hardware (NTAG215)
```

## Roles

| Role | Access |
|------|--------|
| ADMIN | Everything: users, cards, events, attendance, audit |
| OPERATOR | Assigned events, attendance sessions, NFC scanning |
| USER | Own profile, card status, attendance history |
| PUBLIC | Landing page, technology info, compatibility |

## Shared Attendance Engine

All NFC handlers converge on `recordAttendance()`:

```
Web NFC → verifyNFCCredential() ─┐
URL NFC → verifyNFCCredential() ─┤→ recordAttendance() → Audit Log
Manual  → authorizeManualCheckIn()┘
```
