# Versioning Rules

Every release must synchronize these 5 files:
1. `client/src/constants/version.js` — source of truth
2. `package.json` — npm version
3. `CHANGELOG.md` — human-readable history
4. `VERSIONING.md` — policy reference
5. `README.md` — public-facing version badge

Never release with mismatched versions across these files.

Pre-1.0: PATCH = bugfix, MINOR = new feature.
Stages: ALPHA → BETA → RC → PRODUCTION CANDIDATE → LIVE after human acceptance.
