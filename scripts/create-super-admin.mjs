/**
 * Create first SUPER_ADMIN via bootstrap API (local).
 *
 * Usage:
 *   node --env-file=.env.local scripts/create-super-admin.mjs you@email.com 'StrongPass123!'
 */
const email = process.argv[2];
const password = process.argv[3];
const secret = process.env.BOOTSTRAP_ADMIN_SECRET;
const base = process.env.BOOTSTRAP_BASE_URL || 'http://localhost:3000';

if (!email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/create-super-admin.mjs <email> <password>');
  process.exit(1);
}
if (!secret) {
  console.error('Missing BOOTSTRAP_ADMIN_SECRET in env');
  process.exit(1);
}
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT_JSON — add service account JSON to .env.local first');
  process.exit(1);
}

const res = await fetch(`${base}/api/admin/bootstrap`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-bootstrap-secret': secret,
  },
  body: JSON.stringify({
    email,
    password,
    username: email.split('@')[0],
    name: 'Super Admin',
    role: 'super_admin',
  }),
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error('FAILED', res.status, data);
  process.exit(1);
}
console.log('OK — SUPER_ADMIN created:', { uid: data.uid, email: data.email, role: data.role });
console.log('Sign in at /admin with that email/password (or username@admins.tcs-for-engineers.local if you used username convention).');
