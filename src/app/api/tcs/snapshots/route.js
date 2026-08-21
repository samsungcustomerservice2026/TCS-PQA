import { NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse, rateLimit, ROLES } from '../../../../lib/auth/serverAuth';
import { isFirebaseAdminConfigured, getAdminDb } from '../../../../lib/auth/firebaseAdmin';
import { buildTcsSnapshot } from '../../../../lib/tcs/snapshots';
import { writeAuditLog } from '../../../../lib/audit/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST { year, month, division, engineers } — lock monthly snapshot (editor+) */
export async function POST(request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: 'Admin SDK required', code: 'admin_not_configured' }, { status: 503 });
    }
    const ctx = await requireAdmin(request, { minRole: ROLES.EDITOR });
    rateLimit(`tcs-snap:${ctx.uid}`, { limit: 20, windowMs: 60_000 });
    const body = await request.json();
    const year = Number(body.year);
    const month = Number(body.month);
    if (!year || !month) return NextResponse.json({ error: 'year and month required' }, { status: 400 });

    const snap = buildTcsSnapshot({
      year,
      month,
      division: body.division || 'MX',
      engineers: Array.isArray(body.engineers) ? body.engineers : [],
      lockedBy: ctx.uid,
    });

    const db = getAdminDb();
    const ref = db.collection('tcs_snapshots').doc(snap.id);
    const existing = await ref.get();
    if (existing.exists && existing.data()?.locked && ctx.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Snapshot locked — SUPER_ADMIN required to overwrite' }, { status: 403 });
    }
    await ref.set(snap, { merge: true });
    await writeAuditLog({
      actorUid: ctx.uid,
      actorRole: ctx.role,
      action: 'tcs_snapshot_lock',
      entityType: 'tcs_snapshot',
      entityId: snap.id,
      newValue: { engineerCount: snap.engineerCount },
    });
    return NextResponse.json({ ok: true, snapshot: snap });
  } catch (err) {
    return authErrorResponse(err);
  }
}
