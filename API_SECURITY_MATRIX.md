# API_SECURITY_MATRIX.md

| Route | Class | Auth | Notes |
|-------|-------|------|-------|
| POST `/api/gogo/chat` | SERVER DISABLED | n/a | Always 503 `ai_disabled` |
| POST `/api/gogo/product-gemini` | SERVER DISABLED | n/a | Always 503 |
| POST `/api/gogo/speak` | PUBLIC | Rate limit | Edge TTS only |
| POST `/api/gogo/product-search` | PUBLIC | Rate via usage | GSMArena allowlist SSRF |
| POST `/api/consultants/extract` | ADMIN (editor+) | Bearer + Admin SDK | SSRF allowlist |
| GET `/api/samsung-kb` | PUBLIC metadata | none | Shows not ready |
| `*` `/api/samsung-kb/*` | BLOCKED | flag | 503 until PRODUCTION_READY |
| POST `/api/quiz/submit-answer` | PLAYER via membership | Admin SDK | Server scoring |
| POST `/api/quiz/host` | ADMIN (editor+) | Bearer | Host actions |
| POST `/api/admin/bootstrap` | SUPER_ADMIN or bootstrap secret | Bearer / secret | Create admins + claims |
| POST `/api/admin/employees/reset-password` | SUPER_ADMIN | Bearer | Auth password reset |
| POST `/api/tcs/import-excel` | ADMIN (editor+) | Bearer | Dry-run default |
| POST `/api/tcs/snapshots` | ADMIN (editor+) | Bearer | Lock monthly snapshot |
| POST `/api/public/form-gate` | PUBLIC | Rate limit | Survey/feedback spam gate |
