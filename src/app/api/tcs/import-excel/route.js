import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireAdmin, authErrorResponse, rateLimit, ROLES } from '../../../../lib/auth/serverAuth';
import { isFirebaseAdminConfigured, getAdminDb } from '../../../../lib/auth/firebaseAdmin';
import { validateExcelMeta, dryRunTcsImport } from '../../../../lib/tcs/importValidate';
import { writeAuditLog } from '../../../../lib/audit/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST multipart or JSON:
 * - dryRun: true (default) → parse + diff only
 * - dryRun: false + confirmToken → commit (Admin SDK)
 *
 * body JSON: { fileBase64, fileName, mime, collection, dryRun, existing?, confirm: true }
 */
export async function POST(request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: 'Admin SDK required for import', code: 'admin_not_configured' }, { status: 503 });
    }
    const ctx = await requireAdmin(request, { minRole: ROLES.EDITOR });
    rateLimit(`excel-import:${ctx.uid}`, { limit: 10, windowMs: 60_000 });

    const body = await request.json();
    const fileName = String(body.fileName || 'upload.xlsx');
    const mime = String(body.mime || '');
    const b64 = String(body.fileBase64 || '');
    const dryRun = body.dryRun !== false;
    const collection = String(body.collection || 'engineers');

    if (!b64) return NextResponse.json({ error: 'fileBase64 required' }, { status: 400 });
    const buf = Buffer.from(b64, 'base64');
    const meta = validateExcelMeta({ fileName, mime, size: buf.length });
    if (!meta.ok) {
      return NextResponse.json({ error: 'Invalid file', details: meta.errors }, { status: 400 });
    }

    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

    const existing = Array.isArray(body.existing) ? body.existing : [];
    const plan = dryRunTcsImport({ workbookRows: rows, existing, collectionHint: collection });

    if (dryRun || body.confirm !== true) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        plan: {
          summary: plan.summary,
          rejected: plan.rejected.slice(0, 50),
          toAddSample: plan.toAdd.slice(0, 20),
          toUpdateSample: plan.toUpdate.slice(0, 20),
        },
        message: 'Dry-run only. Re-submit with dryRun:false and confirm:true to commit.',
      });
    }

    const db = getAdminDb();
    const batch = db.batch();
    let writes = 0;
    for (const item of plan.toAdd) {
      const ref = db.collection(collection).doc();
      batch.set(ref, { ...item.after, code: item.code, importedAt: new Date().toISOString(), importedBy: ctx.uid });
      writes += 1;
      if (writes >= 400) break;
    }
    for (const item of plan.toUpdate) {
      const id = item.before?.id;
      if (!id) continue;
      const ref = db.collection(collection).doc(id);
      batch.set(ref, { ...item.after, code: item.code, updatedAt: new Date().toISOString(), updatedBy: ctx.uid }, { merge: true });
      writes += 1;
      if (writes >= 400) break;
    }
    await batch.commit();

    await writeAuditLog({
      actorUid: ctx.uid,
      actorRole: ctx.role,
      action: 'excel_import_commit',
      entityType: collection,
      entityId: fileName,
      newValue: plan.summary,
      reason: body.reason || '',
    });

    return NextResponse.json({ ok: true, dryRun: false, committed: writes, summary: plan.summary });
  } catch (err) {
    return authErrorResponse(err);
  }
}
