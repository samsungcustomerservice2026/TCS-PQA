import { NextResponse } from 'next/server';
import { requireSuperAdmin, authErrorResponse, ROLES } from '../../../../lib/auth/serverAuth';
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from '../../../../lib/auth/firebaseAdmin';
import { writeAuditLog } from '../../../../lib/audit/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Bootstrap / link admin users. SUPER_ADMIN only (or one-time BOOTSTRAP_ADMIN_SECRET).
 * body: { email, password?, role, name, username, uid? }
 */
export async function POST(request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: 'Admin SDK required', code: 'admin_not_configured' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const bootstrapSecret = process.env.BOOTSTRAP_ADMIN_SECRET || '';
    const provided = request.headers.get('x-bootstrap-secret') || body.bootstrapSecret || '';

    let actor = null;
    if (bootstrapSecret && provided && provided === bootstrapSecret) {
      actor = { uid: 'bootstrap', role: ROLES.SUPER_ADMIN };
    } else {
      actor = await requireSuperAdmin(request);
    }

    const email = String(body.email || '').trim().toLowerCase();
    const role = String(body.role || 'admin').toLowerCase();
    const name = String(body.name || 'Admin').slice(0, 80);
    const username = String(body.username || email.split('@')[0] || 'admin').slice(0, 40);
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const auth = getAdminAuth();
    const db = getAdminDb();

    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch {
      if (!body.password || String(body.password).length < 8) {
        return NextResponse.json({ error: 'password required (min 8) for new user' }, { status: 400 });
      }
      user = await auth.createUser({
        email,
        password: String(body.password),
        displayName: name,
        emailVerified: true,
      });
    }

    const claimsRole = ['super_admin', 'admin', 'editor', 'viewer'].includes(role) ? role : 'admin';
    await auth.setCustomUserClaims(user.uid, {
      role: claimsRole,
      isAdmin: true,
      isSuperAdmin: claimsRole === 'super_admin',
    });

    const adminDoc = {
      firebaseUid: user.uid,
      email,
      username,
      name,
      role: claimsRole === 'super_admin' ? 'SUPER_ADMIN' : claimsRole.toUpperCase(),
      access: claimsRole === 'super_admin' ? 'ALL' : 'LIMITED',
      // passwordB64 intentionally omitted — Firebase Auth is the credential store
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await db.collection('admins').doc(user.uid).set(adminDoc, { merge: true });

    await writeAuditLog({
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'admin_upsert',
      entityType: 'admin',
      entityId: user.uid,
      newValue: { email, role: claimsRole, username },
    });

    return NextResponse.json({ ok: true, uid: user.uid, email, role: claimsRole });
  } catch (err) {
    return authErrorResponse(err);
  }
}
