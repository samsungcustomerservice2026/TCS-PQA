import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Gemini product lookup DISABLED (security / cost hardening).
 */
export async function POST() {
  return NextResponse.json(
    {
      fallback: true,
      disabled: true,
      code: 'ai_disabled',
      error: 'Smart product lookup temporarily unavailable',
      message:
        'Smart product lookup is disabled. Gemini is not used in this deployment.',
      messageAr: 'بحث المواصفات الذكي معطّل. لا يتم استخدام Gemini في هذا النشر.',
    },
    { status: 503 },
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, disabled: true, code: 'ai_disabled', service: 'gogo-product-gemini' },
    { status: 503 },
  );
}
