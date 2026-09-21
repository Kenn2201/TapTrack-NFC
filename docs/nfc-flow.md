# NFC Flow Documentation

## Mode A — Web NFC (Android Chrome)

1. Operator opens TapTrack on Android Chrome
2. Selects event → Starts attendance session
3. Presses `Start NFC Scanner`
4. Browser requests NFC permission
5. Tap multiple cards — no page navigation
6. Instant attendance recording

Requirements: HTTPS, visible page, user gesture, NFC enabled.

## Mode B — NFC URL (iPhone / Fallback)

1. Physical card contains: `https://nfc.kenncode.me/t#<credential>`
2. iPhone detects NFC tag → OS reads URL
3. Safari opens TapTrack
4. React reads `#credential` from hash
5. POST credential to backend
6. Attendance result displayed

## Feature Detection

```javascript
const supportsWebNFC = 'NDEFReader' in window;
```

Never use user-agent sniffing.
