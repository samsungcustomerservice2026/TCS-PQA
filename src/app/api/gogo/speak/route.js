import { NextResponse } from 'next/server';
import { textForSpeech } from '../../../../lib/gogoSpeechText';
import { synthesizeWithEdgeTts } from '../../../../lib/gogoEdgeTts';
import { isElevenLabsConfigured, synthesizeWithElevenLabs } from '../../../../lib/gogoElevenTts';
import { rateLimit } from '../../../../lib/auth/serverAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_TEXT = 500;

/** GoGo TTS — PUBLIC with rate limit. Gemini removed. */
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'local';
    rateLimit(`gogo-speak:${ip}`, { limit: 40, windowMs: 60_000 });
  } catch (err) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status || 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const lang = body?.lang === 'ar' ? 'ar' : 'en';
  const raw = String(body?.text || '').trim().slice(0, MAX_TEXT);
  const text = textForSpeech(raw, lang);
  if (!text) {
    return NextResponse.json({ error: 'Empty text' }, { status: 400 });
  }

  try {
    const audio = await synthesizeWithEdgeTts(text, lang);
    return NextResponse.json({ ...audio, lang, text });
  } catch (edgeErr) {
    console.warn('GoGo Edge TTS failed:', edgeErr?.message || edgeErr);
  }

  const elevenEnabled = process.env.ELEVENLABS_ENABLED === '1' || process.env.ELEVENLABS_ENABLED === 'true';
  if (elevenEnabled && lang === 'ar' && isElevenLabsConfigured('ar')) {
    try {
      const audio = await synthesizeWithElevenLabs(text, 'ar');
      return NextResponse.json({ ...audio, lang, text });
    } catch (elevenErr) {
      console.warn('GoGo ElevenLabs TTS failed:', elevenErr?.message || elevenErr);
    }
  }

  return NextResponse.json(
    { error: 'Voice temporarily unavailable', fallback: true, code: 'tts_failed' },
    { status: 503 },
  );
}
