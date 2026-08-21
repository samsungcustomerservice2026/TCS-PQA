import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { fetchSafeHttpsBuffer } from '../../../../lib/security/safeFetch';
import { requireAdmin, authErrorResponse, rateLimit, ROLES } from '../../../../lib/auth/serverAuth';
import { isFirebaseAdminConfigured } from '../../../../lib/auth/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractFromWorkbook(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const parts = [];
  for (const name of wb.SheetNames || []) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv?.trim()) parts.push(`Sheet ${name}:\n${csv}`);
  }
  return parts.join('\n\n').slice(0, 80_000);
}

function extractFromPptx(buf) {
  // PPTX is a zip; pull readable XML text nodes without a heavy unzip dep.
  const text = buf.toString('utf8');
  const chunks = [];
  const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
  let m;
  while ((m = re.exec(text))) {
    const t = String(m[1] || '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    if (t) chunks.push(t);
  }
  return chunks.join(' ').replace(/\s+/g, ' ').trim().slice(0, 80_000);
}

function extractFromPdf(buf) {
  const raw = buf.toString('latin1');
  const chunks = [];
  const re = /\((?:\\.|[^\\)]){2,200}\)/g;
  let m;
  while ((m = re.exec(raw))) {
    const inner = m[0]
      .slice(1, -1)
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
    if (/[A-Za-z\u0600-\u06FF]{3,}/.test(inner)) chunks.push(inner);
    if (chunks.length > 4000) break;
  }
  const joined = chunks.join(' ').replace(/\s+/g, ' ').trim();
  return joined.slice(0, 80_000);
}

export async function POST(req) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: 'Admin SDK required', code: 'admin_not_configured' }, { status: 503 });
    }
    const ctx = await requireAdmin(req, { minRole: ROLES.EDITOR });
    rateLimit(`consultants-extract:${ctx.uid}`, { limit: 20, windowMs: 60_000 });

    const body = await req.json();
    const url = String(body?.url || '').trim();
    const fileName = String(body?.fileName || '').toLowerCase();
    if (!url) {
      return NextResponse.json({ error: 'url required' }, { status: 400 });
    }

    // Prefer Firebase Storage / known HTTPS hosts only.
    const allowHosts = [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      'tcs-for-engineers.firebasestorage.app',
    ];

    let buf;
    try {
      buf = await fetchSafeHttpsBuffer(url, { allowHosts, maxBytes: 12 * 1024 * 1024 });
    } catch (err) {
      return NextResponse.json(
        { error: err?.message || 'Fetch blocked', code: err?.code || 'fetch_failed' },
        { status: err?.code === 'ssrf_blocked' ? 400 : 502 },
      );
    }
    let text = '';

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || /sheet|excel/i.test(body?.mime || '')) {
      text = extractFromWorkbook(buf);
    } else if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
      text = extractFromPptx(buf);
    } else if (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp') || fileName.endsWith('.gif') || /image\//i.test(body?.mime || '')) {
      text = `Image attachment: ${fileName || 'photo'}. Review the visual technical consultant material in the viewer.`;
    } else {
      text = extractFromPdf(buf) || extractFromPptx(buf) || extractFromWorkbook(buf);
    }

    return NextResponse.json({
      text: text || '',
      chars: (text || '').length,
      fileName,
    });
  } catch (err) {
    if (err?.status) return authErrorResponse(err);
    console.warn('consultant extract failed:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'extract_failed', text: '' },
      { status: 500 },
    );
  }
}
