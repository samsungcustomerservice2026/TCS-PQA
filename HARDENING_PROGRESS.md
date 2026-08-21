# HARDENING_PROGRESS.md

## Phase 0 — Baseline
Status: COMPLETE

## Phase 1 — Gemini removal
Status: COMPLETE (prior wave + maintained)

## Phase 2 — Admin Firebase Auth
Status: COMPLETE (repo) / PENDING deploy (claims + service account)

Changed:
- `src/lib/auth/adminAuthClient.js` — Firebase Auth login; localStorage not auth proof
- `src/lib/auth/serverAuth.js` — `requireAuth` / `requireAdmin` / `requireSuperAdmin` / `requireEmployee`
- `src/lib/auth/firebaseAdmin.js` — Admin SDK bootstrap
- `src/app/api/admin/bootstrap/route.js` — create/link admins + custom claims
- `ScoraApp.jsx` — removed base64/`adminSession` authorization
- Bootstrap password via `NEXT_PUBLIC_*` removed from supported path

## Phase 3 — Employee Firebase Auth
Status: COMPLETE (repo)

Changed:
- Removed SHA-256 Firestore password fallback
- Removed 30-day `employeeSession_v1` as auth
- Firebase Auth only; admin password reset via `/api/admin/employees/reset-password`

## Phase 4 — Firestore rules
Status: COMPLETE LOCALLY — **not deployed to live Console**

Changed:
- Full `firestore.rules` (deny-by-default + role-based)
- Wired in `firebase.json`

## Phase 5 — API security
Status: COMPLETE (repo)

Protected: quiz submit/host, TCS import/snapshots, consultants extract, admin bootstrap, employee reset, KB gate, speak rate limit, form-gate

## Phase 6 — SSRF
Status: COMPLETE

- `safeFetch.js` used by consultants extract + GSMArena product-search allowlist

## Phase 7–9 — SCORA server scoring / host / fair play
Status: COMPLETE (repo) — requires `FIREBASE_SERVICE_ACCOUNT_JSON` at runtime

- `/api/quiz/submit-answer` — transactional scoring, late/duplicate rejection
- `/api/quiz/host` — admin-authenticated host actions + kick/ban
- Client `submitQuizAnswer` no longer writes scores

## Phase 10–12 — Excel / TCS / PQA / audit
Status: COMPLETE (repo modules + APIs)

- `/api/tcs/import-excel` dry-run + commit
- `/api/tcs/snapshots` locked monthly snapshots
- `audit_logs` writer (Admin SDK)
- `src/lib/pqa/validatePartner.js`

## Phase 13 — Survey/feedback
Status: PARTIAL — `/api/public/form-gate` rate limit wired into submit UI

## Phase 14–19 — Perf / architecture / KB / 3D
Status: PARTIAL–COMPLETE

- Routes: `/tcs` `/pqa` `/admin` `/survey` `/feedback` `/employee` `/consultants` `/scora`
- Monolith extracted to `src/app/ScoraApp.jsx`; thin `page.js`
- Dynamic XLSX + GoGo + 3D reduced-motion/low-end fallback
- KB remains gated

## Phase 21–23 — Tests / CI / monitoring
Status: COMPLETE (repo)

- `npm run test:unit` (9 tests)
- `.github/workflows/ci.yml`
- `src/lib/monitoring/sentry.js` (optional DSN)

## Verification
- `npm run test:unit` PASS
- `npm run test:pqa-map` PASS
- `npm run build` PASS (2026-08-22)
