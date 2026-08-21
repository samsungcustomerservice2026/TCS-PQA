# Firebase production cutover — exact clicks

Project: **tcs-for-engineers**

## ✅ Done in repo / local machine

- [x] `BOOTSTRAP_ADMIN_SECRET` generated into `.env.local` (do not commit)
- [x] `GEMINI_*`, `ELEVENLABS_*`, `NEXT_PUBLIC_BOOTSTRAP_*` removed from `.env.local`
- [x] Helper scripts:
  - `scripts/setup-firebase-production.ps1`
  - `scripts/create-super-admin.mjs`

## ⬜ You must do in browser (CLI is not logged in)

### 1) Enable Email/Password

Open: https://console.firebase.google.com/project/tcs-for-engineers/authentication/providers

1. Get started (if Auth never enabled)
2. **Sign-in method** → **Email/Password**
3. Enable → **Save**

### 2) Create `FIREBASE_SERVICE_ACCOUNT_JSON`

Open: https://console.cloud.google.com/iam-admin/serviceaccounts?project=tcs-for-engineers

1. **Create service account**
   - Name: `scora-admin-sdk`
2. Grant role: **Firebase Admin SDK Administrator Service Agent**
3. **Keys** → **Add key** → **JSON** → download
4. Open the JSON file, minify to one line, paste into `.env.local`:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"tcs-for-engineers",...}
```

Or PowerShell base64:

```powershell
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\key.json"))
# put $b64 as FIREBASE_SERVICE_ACCOUNT_JSON value
```

Restart `npm run dev` after editing `.env.local`.

### 3) Revoke old secrets (even if deleted locally)

| Secret | Where to revoke |
|--------|-----------------|
| Gemini API key | https://aistudio.google.com/apikey → Delete |
| ElevenLabs key | https://elevenlabs.io/app/settings/api-keys → Delete |
| Vercel/hosting env | Remove `GEMINI_*`, `ELEVENLABS_*`, `NEXT_PUBLIC_BOOTSTRAP_*` |
| Old admin passwords | Rotate after Firebase Auth admin exists |

### 4) Login Firebase CLI (for rules deploy)

```powershell
npx firebase login
npx firebase use tcs-for-engineers
npm run deploy:firestore-rules
```

### 5) Create first SUPER_ADMIN

With `npm run dev` running and service account filled:

```powershell
node --env-file=.env.local scripts/create-super-admin.mjs your@email.com "StrongPass123!"
```

Then sign in at `/admin` with that email/password.
