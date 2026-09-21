# Security Policy — TapTrack NFC

## NFC Credential Security

- NFC cards contain only an opaque random credential inside an HTTPS URL.
- The database stores only a SHA-256 hash of the credential.
- Raw credentials are displayed only during card provisioning.
- The NFC UID is never used as a primary authentication secret.
- No personal information is written to physical NFC cards.

## Reporting a Vulnerability

If you discover a security issue, please email: security@kenncode.me

Do not open a public GitHub issue for security vulnerabilities.

## Environment Variables

- Never commit `.env` files.
- `.env.example` contains placeholder values only.
- All secrets must be rotated if accidentally exposed.
