import { NextResponse } from 'next/server';
import { retrieveSamsungKbForQuestion } from '../../../../lib/samsungKb/retrieval';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST { question, catalog?, lang?, focus? }
 * AI retrieval against provided catalog (usually empty until import).
 */
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const question = String(body.question || body.q || '').trim();
  if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 });
  const catalog = Array.isArray(body.catalog) ? body.catalog : [];
  const result = retrieveSamsungKbForQuestion(question, catalog, {
    lang: body.lang,
    focus: body.focus,
  });
  return NextResponse.json(result);
}
