# NFC Flow Documentation

All attendance acquisition methods converge on the shared server attendance engine. NFC acquisition does not bypass event, session, user, card, or duplicate checks.

## Mode A — Web NFC (Android Chromium)

1. ADMIN or OPERATOR signs in.
2. Select an OPEN attendance session.
3. Open the NFC Reader and start scanning.
4. The browser requests NFC permission and exposes `NDEFReader` when supported.
5. Tap a physical card.
6. TapTrack resolves the opaque credential and records attendance through the shared attendance service.

Requirements: HTTPS, visible page, user gesture, NFC enabled, compatible Chromium browser.

**QA status:** engineering support is implemented; physical Android NDEFReader acceptance remains pending.

## Mode B — NFC URL (iPhone / universal fallback)

Physical card:
```
https://nfc.kenncode.me/t#<opaque-random-credential>
```

### Public verification
1. Phone detects the card and offers the HTTPS URL.
2. Safari/browser opens `/t#<credential>`.
3. React reads the fragment and immediately removes it from visible browser history.
4. Client calls the safe card-resolution endpoint.
5. Card status/member-safe details may be shown.
6. **No attendance is created.**

### Authenticated iPhone attendance
1. ADMIN or OPERATOR signs in to Safari.
2. Operator chooses exactly one OPEN attendance session.
3. Operator enables **iPhone Attendance Mode**.
4. Physical card tap opens the same `/t#<credential>` route.
5. Client submits the credential plus selected session ID.
6. Server authenticates the operator, derives the event from the session, validates card/user/session, and records method `NFC_URL`.
7. Duplicate protection returns **Already Recorded** rather than creating another row.

The local attendance context stores only session/event UX context and expiry. It never stores the raw card credential.

## Mode C — Manual attendance

1. ADMIN or OPERATOR selects an OPEN attendance session.
2. Operator searches/selects an active participant.
3. Server records method `MANUAL` through the same attendance service.
4. Invite-only events reject users who are not on the required participant list.

## Feature detection

```javascript
const supportsWebNFC = 'NDEFReader' in window;
```

Never use user-agent sniffing as the source of truth.

## Card privacy

Cards never contain PII. The raw credential exists on the card and is shown only during one-time provisioning/replacement. The database stores a derived HMAC-SHA256 hash, not the raw credential.
