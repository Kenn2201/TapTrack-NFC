# TapTrack NFC — Agent Operating Guidelines

> CRITICAL DIRECTIVE FOR ALL AI ASSISTANTS WORKING ON THIS REPOSITORY:
>
> TapTrack NFC is a PUBLIC, standalone NFC attendance technology demo.
> It must never include information, terminology, source data, credentials,
> schemas, URLs, branding, or member records from unrelated private projects.

---

## Project Identity

Name: TapTrack NFC
Domain: https://nfc.kenncode.me
Purpose: Demonstrate NFC card provisioning, reading, verification, revocation,
replacement, event attendance and audit history.
The repository must remain generic and independently understandable.

---

## Architecture Rule

NFC acquisition and attendance processing MUST remain separate.

Credential handlers:
- Web NFC
- NFC URL
- Manual fallback

must resolve a user/card and then call the SAME attendance service.

Never duplicate the complete attendance business logic into separate
Web-NFC and URL-NFC controllers.

Canonical flow:

NFC Credential → Verify Card → Resolve User → Shared Attendance Service → Attendance Record → Audit Log

---

## NFC Credential Security

Never store personal information directly on an NFC card.

Do not write:
- names
- email
- role
- database user ID
- attendance history

Cards contain only an opaque random credential encoded inside a TapTrack HTTPS URL.

Store only a cryptographic hash of the card credential in PostgreSQL.

Example physical tag:

    https://nfc.kenncode.me/t#<opaque-random-token>

Never use the NFC UID as the primary authentication secret.

---

## Card Lifecycle

Supported states:

    UNASSIGNED
    ACTIVE
    LOST
    REVOKED
    REPLACED
    DISABLED

Never permanently delete a card that has been issued.
Revocation and replacement must preserve audit history.

---

## Browser Compatibility

Use Web NFC only after feature detection:

    'NDEFReader' in window

Never assume NFC support based solely on user-agent strings.
Unsupported devices must retain access to dashboards and management features
while hiding/disabling direct Web NFC scanning.

---

## Public Repository Safety

All demo data must be fictional.

Never commit:
- .env
- credentials
- API keys
- real member data
- unrelated organization names
- private production URLs
- copied proprietary schemas
- private screenshots

.env.example may contain placeholder values only.

---

## Semantic Versioning

The project uses Semantic Versioning.

Release stages:

    PATCH: bug fix, documentation fix, small config correction
    MINOR: new feature, new route, new API, new NFC capability, new dashboard feature
    MAJOR: reserved for stable post-1.0 breaking changes

Release labels:

    v0.x.x ALPHA
    v0.x.x BETA
    v0.x.x RC
    v1.x.x PRODUCTION CANDIDATE (until manual acceptance)

Never mark a v1 candidate LIVE before human acceptance testing passes.

---

## Required Release Files

Every release must synchronize:
1. client/src/constants/version.js
2. package.json
3. CHANGELOG.md
4. VERSIONING.md
5. README.md

Never release with different versions across these files.

---

## Before Release

Run:

    npm test
    npm run build

Verify:

    git status
    git diff
    git diff --cached

Search tracked files for secrets.
Confirm no private-project terminology or data was introduced.
Update the changelog.
Update README release notes.
Then create the release commit.

Never push a release with failing tests or build errors.
