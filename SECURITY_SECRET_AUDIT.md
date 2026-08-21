# SECURITY SECRET AUDIT

**Date:** 2026-08-22  
**Rule:** This document never prints actual secret values.

| Item | Location | Classification | Action |
|------|----------|----------------|--------|
| Firebase web `apiKey`, `authDomain`, `projectId`, `appId`, etc. | `src/firebase.js` (hardcoded) | Sensitive client configuration (normal for Firebase web; abuse mitigated by App Check + rules) | Prefer env injection; enable App Check; never commit service accounts |
| `NEXT_PUBLIC_BOOTSTRAP_ADMIN_PASSWORD_B64` | `.env.example`, `page.js` | **Critical secret wrongly public** | Remove from `NEXT_PUBLIC_*`; bootstrap via Admin SDK / Console only |
| `NEXT_PUBLIC_BOOTSTRAP_ADMIN_USERNAME` / `_NAME` | `.env.example` | Sensitive client configuration | Prefer server-only bootstrap |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_KEY` | `.env.example`, `firebase.js` | Safe public configuration (site key) | Keep public; pair with provider |
| `GEMINI_API_KEY` | `.env.example`, `.env.local` (local), API routes | **Server-only / Critical** | **Remove from production path**; revoke/rotate if ever committed or shared |
| `GEMINI_MODEL`, `GEMINI_TTS_*` | `.env.example` | Server-only config | Remove with Gemini |
| `ELEVENLABS_API_KEY` | `.env.example`, `gogoElevenTts.js` | Server-only / Critical (paid) | Keep optional; never `NEXT_PUBLIC_`; do not enable by default |
| Admin `passwordB64` in Firestore | `admins` docs | **Critical** (reversible) | Migrate to Firebase Auth; delete base64 fields after cutover |
| `adminSession` in localStorage | Browser | Not a secret — **invalid as auth proof** | Replace with Firebase ID token / HttpOnly session |
| `employeeSession_v1` | Browser | Invalid as long-lived auth proof | Firebase Auth session only |
| Service account JSON | Not found in repo scan | Critical if present | Never commit; use Secret Manager / CI secrets |
| README placeholder `YOUR_API_KEY` | `README.md` | Documentation only | OK |

## Findings

1. **No** Firebase private key / service account JSON found in the repository tree during this audit.
2. Gemini is invoked with server `process.env.GEMINI_API_KEY` (correct placement) but routes are **publicly callable** → economic exposure.
3. Bootstrap admin password via `NEXT_PUBLIC_*` is a **severity violation** — treat as exposed; rotate any real password ever set this way.
4. Do **not** commit `.env.local`. Ensure it remains gitignored.

## Recommended rotations (manual)

- [ ] Revoke/rotate any Gemini key that was shared, committed, or used on a public deployment.
- [ ] Rotate bootstrap admin password; recreate admins after Auth migration.
- [ ] Rotate ElevenLabs key if it was ever exposed.
- [ ] Confirm Firebase API key restrictions (HTTP referrer) in Google Cloud Console.
