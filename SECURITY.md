# SECURITY.md

## Authentication

| Actor | Mechanism |
|-------|-----------|
| Admin | Firebase Auth email/password → ID token. Profile in `admins/{uid}`. Roles via custom claims (`role`, `isAdmin`, `isSuperAdmin`). |
| Employee | Firebase Auth only (no SHA-256 fallback). Profile in `employees/{uid}`. |
| Quiz player | Anonymous membership under session; scoring via Admin SDK API |

**Deprecated / removed as security:** `localStorage.adminSession`, `passwordB64` / `btoa`, `NEXT_PUBLIC_BOOTSTRAP_ADMIN_PASSWORD_B64`, `employeeSession_v1`.

## Authorization

Server helpers in `src/lib/auth/serverAuth.js`:
- `requireAuth`
- `requireAdmin({ minRole })`
- `requireSuperAdmin`
- `requireEmployee`

Roles: `super_admin` | `admin` | `editor` | `viewer` | `employee`

## Firestore

Repository rules: `firestore.rules` (deny-by-default). Deploy with:

```bash
npm run deploy:firestore-rules
```

**Live Console must be verified separately.**

## API security

See `API_SECURITY_MATRIX.md`. Sensitive routes require Bearer Firebase ID token + Admin SDK.

## SCORA

Server-authoritative scoring: `POST /api/quiz/submit-answer`  
Host: `POST /api/quiz/host` (editor+)  
Answers collection: client write denied in rules.

## Secrets

Server-only:
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `BOOTSTRAP_ADMIN_SECRET`
- Optional `ELEVENLABS_API_KEY`

Never put secrets in `NEXT_PUBLIC_*`.

## App Check / rate limits

- Optional App Check site key
- In-memory rate limits on speak, quiz, import, form-gate

## Audit logs

`audit_logs` — Admin SDK append only; clients cannot write.

## Incident response (basics)

1. Revoke leaked keys
2. Force password resets via Firebase Auth
3. Review `audit_logs` / activity logs
4. Roll back Firestore rules from Console history if needed
