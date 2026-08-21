import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Gemini smart chat DISABLED (security / cost hardening).
 * Guided GoGo chips continue client-side without this route.
 */
export async function POST() {
  return NextResponse.json(
    {
      fallback: true,
      disabled: true,
      code: 'ai_disabled',
      error: 'AI Assistant temporarily unavailable',
      reply:
        'AI Assistant temporarily unavailable. Use the guided menu chips — smart chat is disabled.',
      replyAr:
        'المساعد الذكي غير متاح مؤقتاً. استخدم الأزرار الإرشادية — الدردشة الذكية معطّلة.',
    },
    { status: 503 },
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, disabled: true, code: 'ai_disabled', service: 'gogo-chat' },
    { status: 503 },
  );
}
