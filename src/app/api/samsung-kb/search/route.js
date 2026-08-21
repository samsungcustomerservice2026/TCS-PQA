import { NextResponse } from 'next/server';
import { searchSamsungKb } from '../../../../lib/samsungKb/search';
import { assertSamsungKbApiAllowed } from '../../../../lib/samsungKb/apiGate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST { catalog?: Product[], query: SearchQuery }
 * Searches the provided catalog slice (or empty). Does not invent hits.
 */
export async function POST(request) {
  const blocked = assertSamsungKbApiAllowed();
  if (blocked) return blocked;
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const catalog = Array.isArray(body.catalog) ? body.catalog : [];
  const query = body.query || body;
  const results = searchSamsungKb(catalog, query);
  return NextResponse.json({
    count: results.length,
    results,
    catalog_size: catalog.length,
    note:
      catalog.length === 0
        ? 'Empty catalog — import verified products before expecting search hits.'
        : undefined,
  });
}
