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
- No `.env.local` is required for core functionality. Optional env vars (copy `.env.example` → `.env.local` if needed):
  - `GEMINI_API_KEY` — enables GoGo AI **smart chat**. Without it, `/api/gogo/chat` returns `{fallback:true}` (HTTP 503) and the assistant still works via guided menu chips + voice I/O (client-side). Set it as a secret if you need to test smart chat.
  - `NEXT_PUBLIC_BOOTSTRAP_ADMIN_PASSWORD_B64` — only needed to bootstrap the admin portal when Firestore has zero admins (value = base64 of the password).
- There is no Jest/Vitest/Playwright suite; the `scripts/*.mjs` test files (`test:pqa-map`, `test-unified-engineer-wide.mjs`, etc.) are standalone node scripts. E2E testing is manual in the browser against live Firebase.
- Admin login uses a custom scheme (base64 password in Firestore `admins`, 2-hour `localStorage` session); there is no Firebase Auth.
