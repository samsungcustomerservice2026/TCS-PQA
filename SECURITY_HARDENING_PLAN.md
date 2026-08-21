# SECURITY HARDENING PLAN

**Status:** Inspection complete — execution starts with Phase 1 (Gemini removal).  
**Date:** 2026-08-22  
**Repo:** `fawzy-project` (Next.js 16.1.6 / React 19.2.3 / Firebase 12.9.0)

> Live Firebase Console rules may differ from repository snippets. Repository has **no** `firestore.rules` file; only `storage.rules` is wired in `firebase.json`. Production Firestore rules **must** be verified manually.

---

## 1. Current architecture

| Layer | Reality |
|-------|---------|
| App | Single Next.js App Router app; primary UI in `src/app/page.js` (~10.7k lines, client) |
| Hosting | Assumed Vercel / Node (`npm run build` / `start`) |
| Data | Firestore + Firebase Storage (project `tcs-for-engineers`) |
| Auth | Custom admin (base64 + localStorage); employee hybrid Firebase Auth + SHA-256 fallback |
| Server | Next.js Route Handlers under `src/app/api/**` (no Cloud Functions directory in repo) |
| 3D / UX | R3F atmosphere, Framer Motion portal launches, GoGo assistant |

### Modules (preserve all)

TCS · PQA · SCORA Challenge · Consultants/Employee · Admin · Surveys · Feedback · GoGo (non-AI) · Samsung KB · Excel import · Dashboards

---

## 2. Current authentication flow

### Admin

1. Load `admins` from Firestore (client SDK).
2. Compare `btoa(password)` to `passwordB64` in browser (`page.js`).
3. Store `{ user, loginAt }` in `localStorage.adminSession` (2h TTL).
4. Bootstrap when zero admins: `NEXT_PUBLIC_BOOTSTRAP_ADMIN_PASSWORD_B64` (public).

**Risk:** Forgeable session; reversible passwords; public bootstrap secret.

### Employee

1. Prefer Firebase Auth email/password (`employeeAuthService.js`).
2. Fallback: Firestore profile + SHA-256(salt:password); 30-day `employeeSession_v1` localStorage.

**Risk:** Long-lived client session; fallback hash comparable offline if docs readable.

### Quiz host

Reads `adminSession` from localStorage for display / soft gate only.

---

## 3. Current authorization flow

- **UI-only** via `adminPermissions.js` / role fields on admin user object.
- **No** server verification of admin for Firestore writes (client SDK).
- **No** auth checks on `/api/*` routes.
- Rule snippets in `src/constants/firebase*.js` often `allow read/write: if true` (“tighten later”).

---

## 4. Current Firestore collections (inventory)

| Domain | Collections / paths |
|--------|---------------------|
| TCS | `engineers`, `tcs_mx_receptionists`, `tcs_mx_galaxy_consultants`, `tcs_da_engineers`, `tcs_vd_engineers`, `tcs_dashboard_winners` |
| PQA | `pqa_mx_centers`, `pqa_ce_centers` |
| Admin | `admins` |
| Survey / feedback | `samsung_academy_survey/...`, `feedback` |
| Quiz | `quiz_templates`, `quiz_live_sessions` (+ `players`, `answers`), `quiz_logs` |
| Consultants | `consultants`, `consultant_announcements`, `employees`, `employee_index`, `employee_progress` |
| GoGo | `gogo_assistant/workspace/{qa,culture,chats,learned,feedback,products}` |
| KB | `samsung_kb/...` |
| Analytics | `analytics/...`, `logs/activity/...` |

---

## 5. Current API routes

| Route | Purpose | Auth today | Cost / risk |
|-------|---------|------------|-------------|
| `/api/gogo/chat` | Gemini smart chat + tools | None | **Gemini $** |
| `/api/gogo/speak` | Edge TTS (+ Gemini TTS / ElevenLabs) | None | Gemini/ElevenLabs $ |
| `/api/gogo/product-gemini` | Gemini product extract | None | **Gemini $** |
| `/api/gogo/product-search` | Non-Gemini product helper | None | Low |
| `/api/consultants/extract` | Fetch URL → extract text | None | **SSRF** |
| `/api/samsung-kb/*` | KB status/search/import/compare | None | Abuse / unfinished KB |

---

## 6. Current SCORA data flow

1. Admin creates template → `quiz_templates`.
2. Host starts session → `quiz_live_sessions` + PIN.
3. Players join → `players` subcollection.
4. Host advances questions; players call `submitQuizAnswer` in **browser**.
5. Client grades + increments score in Firestore (`quizService.js`).

**Risk:** Client-authoritative scoring.

---

## 7. Gemini / GoGo dependencies

- REST calls to `generativelanguage.googleapis.com` (no `@google/generative-ai` package).
- Files: `api/gogo/chat`, `product-gemini`, `speak` (TTS); client `GoGoAssistant.jsx`, `gogoVoice.js`, many `gogoGemini*` libs.
- Env: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TTS_*`.

**Business decision:** Remove Gemini from production request path entirely (Phase 1).

---

## 8. Identified vulnerabilities (summary)

See also prior audit canvas. Critical:

1. Client admin auth (base64 + localStorage)
2. Open / permissive Firestore rule snippets; no repo `firestore.rules`
3. Unauthenticated APIs + Gemini spend
4. Client quiz scoring
5. SSRF on consultants extract
6. `NEXT_PUBLIC_` bootstrap password
7. Samsung KB exposed while `PRODUCTION_READY = false`

---

## 9. Planned fixes (priority)

### P0 (this execution wave)

1. Documentation (this file + secret/Gemini/baseline audits)
2. **Remove Gemini** from all request paths; disable smart AI UX cleanly
3. Kill/gate cost APIs; protect or disable KB + extract
4. Add deny-by-default `firestore.rules` **in repo** + deploy checklist (live verify separate)
5. Stub/scaffold Firebase Auth admin path without breaking existing login until migration cutover
6. Start API auth helpers + SSRF allowlist

### P1+

Server quiz scoring (Cloud Functions or Next route + Admin SDK), Excel import server path, page.js split, pagination, tests, CI — sequential after P0.

---

## 10. Files expected to change (Phase 1 focus)

- `src/app/api/gogo/chat/route.js`
- `src/app/api/gogo/product-gemini/route.js`
- `src/app/api/gogo/speak/route.js`
- `src/components/gogo/GoGoAssistant.jsx`
- `src/lib/gogoVoice.js` (stop Gemini TTS fetch)
- `.env.example`, `AGENTS.md`
- New: `SECURITY_*.md`, `GEMINI_USAGE_AUDIT.md`, `BASELINE_REPORT.md`, `HARDENING_PROGRESS.md`
- Later: `firestore.rules`, API middleware, `quizService.js`, auth modules

---

## 11. Migration risks

| Risk | Mitigation |
|------|------------|
| Breaking GoGo UX | Keep guided chips + Edge TTS; explicit “AI unavailable” for smart chat |
| Admin Auth cutover locks operators | Dual-run: keep old login until claims ready; then feature flag |
| Strict Firestore rules break client writes | Matrix first; deploy rules only after Admin SDK / Auth ready |
| No Firebase Admin credentials in CI | Document manual Console steps |

---

## 12. Rollback strategy

- Git revert Phase commits.
- Re-enable Gemini routes only by restoring files + env (not recommended).
- Firestore rules: keep previous rules version in Console history / git.
- Feature flags: `GOGO_AI_ENABLED=false` default.

---

## 13. Explicit non-goals (now)

- No Flutter rewrite
- No new backend framework
- No new paid AI provider
- No full `page.js` rewrite in Phase 1
