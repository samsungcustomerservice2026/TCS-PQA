import { NextResponse } from 'next/server';
import { createEmptyProductRecord, validateProductRecord } from '../../../../lib/samsungKb/schema';
import { emptyCatalogMeta } from '../../../../lib/samsungKb/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET — empty list contract. Large catalogs should be read via client Firestore service.
 * Server does not invent product rows.
 */
export async function GET() {
  return NextResponse.json({
    products: [],
    meta: emptyCatalogMeta(),
    note: 'Use samsungProductKbService.listSamsungKbProducts() in the admin client against Firestore. Server list stays empty by design until a secure admin API key is added.',
  });
}

/**
 * POST — validate / normalize one product payload. Does not persist (client service writes Firestore).
 */
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const draft = createEmptyProductRecord(body);
    const validation = validateProductRecord(draft);
    if (!validation.ok) {
      return NextResponse.json({ error: 'Validation failed', ...validation }, { status: 422 });
    }
    return NextResponse.json({ product: draft, validation });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Invalid product' }, { status: 400 });
  }
}
