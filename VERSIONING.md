# TapTrack NFC — Versioning & Release Policy

TapTrack NFC follows [Semantic Versioning](https://semver.org/).

## Source of Truth

    client/src/constants/version.js

## Synced Release Files

1. `client/src/constants/version.js`
2. `package.json`
3. `CHANGELOG.md`
4. `VERSIONING.md`
5. `README.md`

## Pre-1.0 Rules

| Type | Description |
|------|-------------|
| PATCH | Bug fixes and small maintenance changes |
| MINOR | New functionality, API routes, NFC features or UI workflows |

## Release Stages

| Stage | Description |
|-------|-------------|
| ALPHA | Core development |
| BETA | Feature-complete enough for public testing |
| RC | Release candidate |
| LIVE | Stable public release |

## Required Checks

```bash
npm test
npm run build
git status
```

- No secrets
- No private data
- No unrelated project terminology
