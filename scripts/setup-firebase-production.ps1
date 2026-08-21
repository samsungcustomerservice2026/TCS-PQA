# Production secrets setup — run AFTER `npx firebase login`
# Usage (PowerShell):
#   .\scripts\setup-firebase-production.ps1

$ErrorActionPreference = "Stop"
$ProjectId = "tcs-for-engineers"

Write-Host "==> Checking Firebase login..." -ForegroundColor Cyan
$login = npx firebase login:list 2>&1 | Out-String
if ($login -match "No authorized accounts") {
  Write-Host "Not logged in. Opening firebase login..." -ForegroundColor Yellow
  Write-Host "Complete the browser sign-in, then re-run this script." -ForegroundColor Yellow
  npx firebase login
  exit 1
}

Write-Host "==> Using project $ProjectId" -ForegroundColor Cyan
npx firebase use $ProjectId

Write-Host @"

============================================================
MANUAL STEPS (Firebase / Google Cloud Console) — required
============================================================

1) Enable Email/Password auth
   https://console.firebase.google.com/project/$ProjectId/authentication/providers
   → Sign-in method → Email/Password → Enable → Save

2) Create FIREBASE_SERVICE_ACCOUNT_JSON
   https://console.cloud.google.com/iam-admin/serviceaccounts?project=$ProjectId
   → Create service account (e.g. scora-admin-sdk)
   → Role: Firebase Admin SDK Administrator Service Agent
     (or Editor if needed for setup)
   → Keys → Add key → JSON → download
   → Paste the ENTIRE JSON as ONE LINE into .env.local:
        FIREBASE_SERVICE_ACCOUNT_JSON={...}
   Or base64-encode the file and paste that instead.

3) Revoke old secrets (do this even if already deleted from .env.local)
   - Gemini: https://aistudio.google.com/apikey  → Delete/rotate old keys
   - ElevenLabs: https://elevenlabs.io/app/settings/api-keys → Delete old key
   - Hosting/Vercel: remove GEMINI_*, ELEVENLABS_*, NEXT_PUBLIC_BOOTSTRAP_*
   - Change any old admin passwords that used base64 bootstrap

4) Create first SUPER_ADMIN (after service account is in .env.local)
   Restart: npm run dev
   Then POST /api/admin/bootstrap with header:
     x-bootstrap-secret: <BOOTSTRAP_ADMIN_SECRET from .env.local>
   Body JSON:
     {
       "email": "your-admin@example.com",
       "password": "ChooseAStrongPassword8+",
       "username": "admin",
       "name": "Super Admin",
       "role": "super_admin"
     }

5) Deploy Firestore rules (only when ready for Auth cutover)
   npm run deploy:firestore-rules

============================================================
"@ -ForegroundColor Green

Write-Host "BOOTSTRAP_ADMIN_SECRET is already in .env.local (generated locally)." -ForegroundColor Cyan
Write-Host "Done checklist printed. Complete Console steps 1–3 above." -ForegroundColor Cyan
