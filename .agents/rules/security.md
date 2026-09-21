# Security Rules

- Never commit .env, credentials, API keys, or real member data.
- NFC cards store only opaque hashed credentials, never PII.
- All demo data must be fictional (Alex Rivera, Jamie Chen, Sam Torres, etc).
- Never reference private organization names, production URLs, or proprietary schemas.
- .env.example may contain placeholder values only.
- Raw NFC credentials displayed only during card provisioning.
- Store only SHA-256 hash of card credential in database.
