# PRODUCTION_CHECKLIST.md

## Security

- [x] Gemini API calls removed from production request path
- [x] Gemini keys removed from supported env docs
- [x] Firebase Auth implemented for admins (client + server helpers)
- [x] Custom claims set via `/api/admin/bootstrap`
- [x] Admin localStorage auth removed as authorization
- [x] Employee SHA-256 fallback removed
- [x] Firestore deny-by-default rules written + wired in `firebase.json`
- [ ] Firestore rules **deployed** and verified in Firebase Console
- [x] Sensitive API routes require authentication (when Admin SDK configured)
- [x] SSRF protections on URL fetch endpoints
- [x] Secrets not in NEXT_PUBLIC for bootstrap/Gemini
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` set on hosting
- [ ] `BOOTSTRAP_ADMIN_SECRET` set; first SUPER_ADMIN created
- [ ] App Check enabled in production
- [x] Rate limits on key public/sensitive APIs

## SCORA

- [x] Client submit path uses server scoring API
- [x] Server validates answers / timing / duplicates
- [x] Host actions authenticated (API)
- [ ] Live competitive quiz verified with Admin SDK credentials

## Data integrity

- [x] Excel dry-run + commit API
- [x] TCS snapshot lock API
- [x] Audit log writer
- [x] PQA partner validation helper

## KB / forms

- [x] Samsung KB gated while not production-ready
- [x] Survey/Feedback form-gate rate limit

## Quality

- [x] Unit tests (`npm run test:unit`)
- [x] CI workflow
- [x] Production build passing
- [ ] Monitoring DSN configured (optional Sentry)

## Status gate

Critical remaining: **deploy Firestore rules** + **configure Firebase Admin service account** on the host + **create first Firebase Auth admin** + **verify live quiz scoring**.

Until those are done in production:

**SECURITY STATUS: NOT READY**
