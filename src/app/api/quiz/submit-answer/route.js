import { NextResponse } from 'next/server';
import { scoreAnswerServer } from '../../../../lib/quiz/scoreAnswerServer';
import { rateLimit, authErrorResponse } from '../../../../lib/auth/serverAuth';
import { isFirebaseAdminConfigured } from '../../../../lib/auth/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST { sessionId, playerId, answer, nickname? }
 * Player membership validated server-side. Score is NEVER taken from client.
 *
 * Note: live quiz players may be anonymous (no Firebase Auth). Authorization is
 * membership of playerId under the session, enforced with Admin SDK.
 * Optional Authorization header is accepted for authenticated employees.
 */
export async function POST(request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        {
          error: 'Server scoring unavailable until FIREBASE_SERVICE_ACCOUNT_JSON is configured',
          code: 'admin_not_configured',
        },
        { status: 503 },
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'local';
    rateLimit(`quiz-answer:${ip}`, { limit: 120, windowMs: 60_000 });

    const body = await request.json();
    const sessionId = String(body?.sessionId || '').trim();
    const playerId = String(body?.playerId || '').trim();
    const answer = body?.answer;
    const nickname = String(body?.nickname || '').slice(0, 24);

    if (!sessionId || !playerId || answer == null) {
      return NextResponse.json({ error: 'sessionId, playerId, answer required' }, { status: 400 });
    }

    // Reject client-supplied score/correct/points if present (ignore silently)
    const result = await scoreAnswerServer({
      sessionId,
      playerId,
      answer,
      nickname,
    });

    return NextResponse.json({
      ok: true,
      correct: result.correct,
      points: result.points,
      revealed: result.revealed,
      duplicate: !!result.duplicate,
      questionIndex: result.questionIndex,
    });
  } catch (err) {
    if (err?.status) return authErrorResponse(err);
    return NextResponse.json(
      { error: err?.message || 'Submit failed', code: err?.code || 'error' },
      { status: err?.status || 500 },
    );
  }
}
