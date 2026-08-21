# FIRESTORE_SECURITY_MATRIX.md

**Repository vs live:** There is **no** `firestore.rules` in `firebase.json`. Snippets under `src/constants/firebase*.js` are documentation / paste helpers only. **Live production rules must be verified in Firebase Console.**

Default target: **DENY BY DEFAULT**.

| Collection | Public Read | Employee Read | Employee Write | Admin Read | Admin Write | Server Only |
|------------|-------------|---------------|----------------|------------|-------------|-------------|
| engineers (+ TCS_* ) | Limited public fields OR via aggregate | own row if linked | photo self-service only | yes | yes | aggregates |
| pqa_*_centers | limited | no | no | yes | yes | — |
| admins | **no** | no | no | self limited | SUPER_ADMIN | claims sync |
| employees / employee_index | no | own | own profile fields | yes | yes | — |
| employee_progress | no | own uid | own progress | yes | yes | — |
| consultants | published only | published | no | yes | yes | — |
| quiz_templates | no | no | no | yes | yes | — |
| quiz_live_sessions | join metadata only | player self | join only | host | host | **scores** |
| …/players | limited | self | self nickname | host | host | score fields server |
| …/answers | no | no | submit via Function | host | no | **writes server** |
| feedback / survey | create only (App Check) | no | create | yes | yes | — |
| gogo_assistant/* | limited | limited | own chat | yes | yes | — |
| samsung_kb/* | no until ready | no | no | yes | yes | — |
| analytics / logs | no | no | append limited | yes | SUPER_ADMIN | — |
| audit_logs (planned) | no | no | no | yes | **no** | server append |

## Manual production checklist

- [ ] Open Firebase Console → Firestore → Rules
- [ ] Confirm no `allow read, write: if true` on sensitive collections
- [ ] Deploy new deny-by-default rules only after Admin SDK / Auth cutover tested on staging
