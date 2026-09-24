# Browser & Device Compatibility

## Current acceptance status

| Platform | Browser | Direct Web NFC | NFC URL | Physical QA |
|----------|---------|----------------|---------|-------------|
| Android | Compatible Chromium | Engineering support | Yes | **Direct NDEFReader pending** |
| Android | Other browsers | No | Yes | URL fallback not yet part of the final Android physical QA pass |
| iPhone | Safari | No | **Yes** | **Passed**: public verification, authenticated NFC URL attendance, duplicate handling |
| Desktop | Modern browser | No | Management/manual workflows | Not applicable for direct NFC scanning |

TapTrack feature-detects Web NFC:

```javascript
const supportsWebNFC = 'NDEFReader' in window;
```

Do not use user-agent sniffing as the source of truth.

## iPhone Safari

A physical NFC card stores a TapTrack HTTPS URL with an opaque fragment credential.

### Public verification
1. Tap the card.
2. Open the iPhone NFC notification.
3. Safari opens `/t#<credential>`.
4. TapTrack immediately removes the fragment from the visible URL.
5. The card is resolved safely.
6. **No attendance is recorded without authenticated operator attendance context.**

### Authenticated attendance
1. ADMIN or OPERATOR signs in to Safari.
2. Select one OPEN attendance session.
3. Enable **iPhone Attendance Mode**.
4. Tap a physical card and open the NFC notification.
5. TapTrack records attendance into that exact selected session with method `NFC_URL`.
6. A duplicate tap for the same user/session returns **Already Recorded**.

The attendance context is per browser/device and is cleared on stop, expiry, invalid session, or logout.

## Android Web NFC

TapTrack implements direct NDEFReader scanning for compatible Chromium browsers over HTTPS. The browser must expose `NDEFReader`, NFC must be enabled, and the scan must begin from a user gesture.

**Acceptance note:** physical Android NDEFReader/Web NFC validation remains pending. Do not describe it as physically passed until that QA is completed.

## Desktop experience

Desktop users can use account, event, card-management, reporting, audit, and manual attendance workflows. Desktop browsers do not provide TapTrack's direct NFC scanning path.

## Privacy

Physical cards contain no names, emails, roles, attendance records, or database user IDs. They contain only the TapTrack URL plus an opaque random credential. The server stores only a derived credential hash.
