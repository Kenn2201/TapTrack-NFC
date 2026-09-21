# Architecture Rules

## Shared Attendance Engine
NFC acquisition and attendance processing MUST remain separate.
All credential handlers (Web NFC, NFC URL, Manual) must resolve a user/card
then call the SAME `recordAttendance()` service function.

## Canonical Flow
```
NFC Credential → Verify Card → Resolve User → Shared Attendance Service → Record → Audit Log
```

## Feature Detection
Use `'NDEFReader' in window` — never user-agent sniffing.

## Card States
UNASSIGNED → ACTIVE → LOST/REVOKED/REPLACED/DISABLED
Never delete issued cards. Preserve audit history.

## Roles
ADMIN > OPERATOR > USER > PUBLIC
No Super Admin in v1.
