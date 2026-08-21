# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **Next.js 16 (App Router) + React 19** app (JavaScript, package manager: **npm**). It powers the Samsung EG SCORA ecosystem (TCS engineer ranking, PQA audits, SCORA Challenge quiz, GoGo AI assistant, surveys, admin portal). There is no separate backend, Docker, or local database.

### Services
- **Next.js dev server** — the only service to run. Standard commands live in `package.json`:
  - Dev: `npm run dev` (webpack, http://localhost:3000). `npm run dev:turbo` is the Turbopack variant.
  - Lint: `npm run lint`. Build: `npm run build`. Non-Firebase unit test: `npm run test:pqa-map`.
- **Firebase (Firestore + Storage)** — cloud-hosted, project `tcs-for-engineers`. Client config is hardcoded in `src/firebase.js`, so the app connects to live Firebase with no extra setup as long as the VM has outbound network access. The leaderboard and most flows read live data directly.

### Non-obvious notes
- `npm run lint` currently reports pre-existing errors/warnings (see `lint_output.txt`); these are in the existing code and are not caused by setup. Do not treat them as environment breakage.
- Next.js prints a deprecation warning that `middleware` should be renamed to `proxy`. This is harmless; the app runs fine.
- No `.env.local` is required for core UI, but **production security features require server secrets**:
 - `FIREBASE_SERVICE_ACCOUNT_JSON` — Firebase Admin SDK (quiz scoring, host APIs, Excel commit, admin bootstrap). Without it those APIs return 503.
 - `BOOTSTRAP_ADMIN_SECRET` — one-time / SUPER_ADMIN bootstrap for `POST /api/admin/bootstrap`.
 - **Gemini / smart GoGo chat is DISABLED** — do not set `GEMINI_API_KEY`. `/api/gogo/chat` and `/api/gogo/product-gemini` return 503 `{disabled:true}`. Guided menu chips + Edge TTS still work.
 - `NEXT_PUBLIC_FIREBASE_APPCHECK_KEY` — optional App Check site key.
 - **Do not use** `NEXT_PUBLIC_BOOTSTRAP_ADMIN_PASSWORD_B64` (removed as auth mechanism).
- Admin login uses **Firebase Authentication** (not base64/`localStorage.adminSession`). Create admins via `/api/admin/bootstrap`.
- Employee login uses **Firebase Authentication only** (SHA-256 fallback removed).
- Deploy Firestore rules: `npm run deploy:firestore-rules` (verify in Console — repo rules ≠ live until deployed).
- Tests: `npm run test:unit`, `npm run test:pqa-map`. CI: `.github/workflows/ci.yml`.
- **GoGo voice:** STT via Web Speech API; TTS via `/api/gogo/speak` (Edge neural — **no Gemini**). `Permissions-Policy` must include `microphone=(self)`.
