import { NextResponse } from 'next/server';
import {
  importProductsFromCsv,
  importProductsFromJson,
} from '../../../../lib/samsungKb/importParse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST import parse only (no silent invent).
 * body: { format: 'json'|'csv', payload: object|string }
 * Returns validated products for the admin client to persist.
 */
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const format = String(body.format || 'json').toLowerCase();
  let parsed;
  if (format === 'csv') {
    parsed = importProductsFromCsv(String(body.payload || body.csv || ''));
  } else {
    parsed = importProductsFromJson(body.payload ?? body.products ?? body);
  }

  return NextResponse.json({
    ...parsed,
    persist: false,
    note: 'Parse-only. Persist via admin samsungProductKbService.importSamsungKbProducts after review.',
  });
}
