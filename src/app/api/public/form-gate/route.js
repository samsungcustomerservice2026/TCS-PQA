import { NextResponse } from 'next/server';
import { rateLimit } from '../../../../lib/auth/serverAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lightweight spam gate for public forms.
 * Client should call before Firestore write (App Check still recommended).
 * POST { form: 'survey'|'feedback', fingerprint? }
 */
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'local';
    const body = await request.json().catch(() => ({}));
    const form = String(body.form || 'public');
    rateLimit(`public-form:${form}:${ip}`, { limit: 8, windowMs: 10 * 60_000 });
    return NextResponse.json({ ok: true, allowed: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, allowed: false, error: err.message, code: err.code || 'rate_limited' },
      { status: err.status || 429 },
    );
  }
}
