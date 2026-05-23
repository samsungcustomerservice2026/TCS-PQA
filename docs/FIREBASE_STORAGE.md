# Fix Firebase Storage `storage/unauthorized`

The app uploads images from the browser (no Firebase Auth). Storage must allow writes for these paths:

| Path | Used for |
|------|----------|
| `tcs/all-products-images/*` | Admin → Display → **Sync Division Images** |
| `mx/`, `da/`, `av/` | TCS engineer profile photos |
| `engineers/` | Legacy engineer photos |
| `PQA/` | PQA service center photos |

## Option A — Firebase Console (fastest)

1. Open [Firebase Console](https://console.firebase.google.com/) → project **tcs-for-engineers**.
2. Go to **Storage** → **Rules**.
3. Replace all rules with the contents of [`storage.rules`](../storage.rules) in this repo.
4. Click **Publish**.
5. Wait ~30 seconds, then try **Sync Division Images** again in Admin → Display.

## Option B — Firebase CLI

```bash
npm install -g firebase-tools
firebase login
cd fawzy-project
firebase use tcs-for-engineers
firebase deploy --only storage
```

## Security note

These rules allow **anyone with your web app** to upload images if they know the paths. For an internal Samsung tool this is usually acceptable. For stricter security, add Firebase Authentication for admins or move uploads to a server API with the Admin SDK.
