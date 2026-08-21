# FINAL_SECURITY_HARDENING_REPORT.md

**Date:** 2026-08-22  
**SECURITY STATUS: NOT READY**

## 1. Executive summary

Repository hardening for authentication, API protection, SCORA server scoring, Firestore rules, Excel dry-run, audit logging, route split, tests, CI, and Gemini removal is implemented in code. Production remains **NOT READY** until Firebase Admin credentials are installed, Firestore rules are deployed to the live project, and the first Firebase Auth admins are provisioned and verified.

## 2. Security

### Authentication
- Admin: Firebase Auth (`signInAdmin`); no base64 password compare; no `adminSession` as auth proof
- Employee: Firebase Auth only; SHA-256 fallback removed
- Server: `requireAuth` / `requireAdmin` / `requireSuperAdmin` / `requireEmployee`

### Authorization
- Roles via custom claims + `admins/{uid}`
- SUPER_ADMIN for bootstrap/role-sensitive ops

### Firestore
- Complete deny-by-default `firestore.rules` in repo + `firebase.json`
- Quiz answers: client write denied
- Audit logs: client write denied

### API protection
- Quiz, TCS import/snapshots, consultants extract, admin APIs protected
- GoGo chat/product-gemini remain disabled
- Speak + form-gate rate-limited

### SSRF
- `safeFetch` + allowlists on extract and GSMArena fetches

### Secrets
- `.env.example` documents server-only Admin SDK + bootstrap secret
- No Gemini keys in supported path

## 3. SCORA

- Server scoring transaction in `scoreAnswerServer`
- Late answer rejection (server time + grace)
- Duplicate idempotent response
- Host API: next/reveal/end/pause/resume/kick/ban
- Leaderboard aggregate helper added (`leaderboard_aggregates` write via Admin SDK helper)

## 4. TCS/PQA

- `/api/tcs/import-excel` dry-run/commit
- `/api/tcs/snapshots` locked finals
- PQA partner validation helper
- Audit log on import/snapshot/host/admin actions

## 5. Architecture

- `src/app/ScoraApp.jsx` extracted from monolith
- Routes: `/tcs` `/pqa` `/admin` `/admin/users|security|audit` `/survey` `/feedback` `/employee` `/consultants` `/scora`

## 6. Performance

- Dynamic import XLSX + GoGo + route-level ScoraApp
- 3D: reduced-motion + low-end + `scoraDisable3d` fallback
- Top-N leaderboard helper (aggregate collection ready)

## 7. Testing

| Suite | Result |
|-------|--------|
| `npm run test:unit` | PASS (9) |
| `npm run test:pqa-map` | PASS (13) |
| Playwright E2E | Not added (no browser suite yet) |

## 8. Build

**`npm run build` — PASS** (Next.js 16.1.6)

## 9. Manual actions (your access required)

1. Create Firebase service account → set `FIREBASE_SERVICE_ACCOUNT_JSON` on Vercel/host
2. Set `BOOTSTRAP_ADMIN_SECRET`; call `POST /api/admin/bootstrap` to create SUPER_ADMIN
3. Enable Email/Password in Firebase Authentication Console
4. Deploy rules: `npm run deploy:firestore-rules` (or Console paste) — **verify live**
5. Revoke any old Gemini / ElevenLabs / bootstrap passwords previously exposed
6. Optionally set `NEXT_PUBLIC_FIREBASE_APPCHECK_KEY` and `NEXT_PUBLIC_SENTRY_DSN`
7. Migrate legacy `admins` docs (passwordB64) to Firebase Auth UIDs

## 10. Remaining risks

- Until Admin SDK is configured, quiz scoring/host/import APIs return 503
- Until rules are deployed, live Firestore may still be permissive
- Anonymous quiz join still allows client player create (score locked to 0); membership abuse mitigated by server scoring
- Legacy admin documents with passwordB64 may still exist in Firestore (unused by app login)
- Full E2E Playwright coverage not yet present
- `gogo_assistant` rules still relatively open for guided UX

## 11. Final status

**SECURITY STATUS: NOT READY**
