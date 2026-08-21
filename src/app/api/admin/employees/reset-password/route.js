import { NextResponse } from 'next/server';
import { requireSuperAdmin, authErrorResponse, rateLimit } from '../../../../../lib/auth/serverAuth';
import { getAdminAuth, isFirebaseAdminConfigured } from '../../../../../lib/auth/firebaseAdmin';
import { writeAuditLog } from '../../../../../lib/audit/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** SUPER_ADMIN: reset employee Firebase Auth password */
export async function POST(request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: 'Admin SDK required', code: 'admin_not_configured' }, { status: 503 });
    }
    const ctx = await requireSuperAdmin(request);
    rateLimit(`emp-reset:${ctx.uid}`, { limit: 20, windowMs: 60_000 });
    const body = await request.json();
    const uid = String(body.uid || '').trim();
    const newPassword = String(body.newPassword || '');
    if (!uid || newPassword.length < 6) {
      return NextResponse.json({ error: 'uid and password (min 6) required' }, { status: 400 });
    }
    await getAdminAuth().updateUser(uid, { password: newPassword });
    await writeAuditLog({
      actorUid: ctx.uid,
      actorRole: ctx.role,
      action: 'employee_password_reset',
      entityType: 'employee',
      entityId: uid,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return authErrorResponse(err);
  }
}
