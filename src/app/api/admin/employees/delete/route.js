import { NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse, rateLimit, ROLES } from '../../../../../lib/auth/serverAuth';
import {
  getAdminAuth,
  getAdminDb,
  isFirebaseAdminConfigured,
} from '../../../../../lib/auth/firebaseAdmin';
import { writeAuditLog } from '../../../../../lib/audit/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeGspn(gspnId) {
  return String(gspnId || '').trim().toUpperCase().replace(/\s+/g, '');
}

/** ADMIN+: permanently delete employee Auth account + Firestore profile/index/progress */
export async function POST(request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: 'Admin SDK required', code: 'admin_not_configured' }, { status: 503 });
    }
    const ctx = await requireAdmin(request, { minRole: ROLES.ADMIN });
    rateLimit(`emp-delete:${ctx.uid}`, { limit: 20, windowMs: 60_000 });

    const body = await request.json();
    const uid = String(body.uid || '').trim();
    if (!uid) {
      return NextResponse.json({ error: 'uid required' }, { status: 400 });
    }

    const db = getAdminDb();
    const profileSnap = await db.collection('employees').doc(uid).get();
    const profile = profileSnap.exists ? profileSnap.data() || {} : {};
    const email = normalizeEmail(profile.email);
    const gspnId = normalizeGspn(profile.gspnId);

    // Progress docs for this employee (batch in chunks of 400)
    const progressSnap = await db.collection('employee_progress').where('uid', '==', uid).get();
    const refsToDelete = [...progressSnap.docs.map((d) => d.ref)];
    if (profileSnap.exists) refsToDelete.push(profileSnap.ref);
    if (gspnId) refsToDelete.push(db.collection('employee_index').doc(`gspn_${gspnId}`));
    if (email) refsToDelete.push(db.collection('employee_index').doc(`email_${email}`));

    for (let i = 0; i < refsToDelete.length; i += 400) {
      const batch = db.batch();
      refsToDelete.slice(i, i + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    try {
      await getAdminAuth().deleteUser(uid);
    } catch (err) {
      // Profile already removed; Auth user may already be gone
      if (err?.code !== 'auth/user-not-found') throw err;
    }

    await writeAuditLog({
      actorUid: ctx.uid,
      actorRole: ctx.role,
      action: 'employee_delete',
      entityType: 'employee',
      entityId: uid,
      meta: { email, gspnId },
    });

    return NextResponse.json({ ok: true, uid, email, gspnId });
  } catch (err) {
    return authErrorResponse(err);
  }
}
