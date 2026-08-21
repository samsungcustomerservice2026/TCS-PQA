# BASELINE_REPORT.md

**Date:** 2026-08-22

## Git

- Branch: `main` (tracks `origin/main`)
- Working tree: **dirty** — many prior feature changes (portal animations, admin shell, consultants, etc.) already uncommitted
- Checkpoint commit: **not created automatically** to avoid mixing unrelated WIP; recommend user commit hardening docs + Phase 1 separately when ready

## Versions

| Package | Version |
|---------|---------|
| next | 16.1.6 |
| react | 19.2.3 |
| firebase | ^12.9.0 |
| @google/generative-ai | not installed |

## Tests

| Command | Result |
|---------|--------|
| `npm run test:pqa-map` | PASS (13 partner map cases) |
| Jest/Vitest/Playwright | none configured |

## Lint / build

| Command | Result |
|---------|--------|
| `npm run lint` | Pre-existing errors/warnings expected (`lint_output.txt`); not treated as Phase 0 blockers |
| `npm run build` | Not re-run in this baseline slice (large app); run before production deploy |

## Known pre-existing failures (do not “fix” in Phase 0)

- `react/no-unescaped-entities` and `no-img-element` warnings in mega `page.js`
- Middleware → proxy deprecation warning
- Custom admin auth (base64) — tracked as P0 security work, not a “lint fix”

## Firebase rules in repo

- `firebase.json` only wires **storage** rules (`storage.rules`)
- **No** `firestore.rules` file in repository — live Console rules unknown to this audit
