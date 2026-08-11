import { NextResponse } from 'next/server';
import { textForSpeech } from '../../../../lib/gogoSpeechText';
import { synthesizeWithEdgeTts } from '../../../../lib/gogoEdgeTts';
import { isElevenLabsConfigured, synthesizeWithElevenLabs } from '../../../../lib/gogoElevenTts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_TEXT = 500;

/** Optional Gemini male voices (only used if Gemini TTS actually works). */
const MALE_VOICES = new Set([
  'Charon',
  'Orus',
  'Fenrir',
  'Puck',
  'Alnilam',
  'Schedar',
  'Achird',
  'Sadaltager',
]);

const DEFAULT_VOICE_EN = sanitizeMaleVoice(process.env.GEMINI_TTS_VOICE_EN || 'Charon');
const DEFAULT_VOICE_AR = sanitizeMaleVoice(process.env.GEMINI_TTS_VOICE_AR || 'Orus');
const GEMINI_TTS_MODELS = [
  process.env.GEMINI_TTS_MODEL,
  'gemini-2.5-flash-preview-tts',
  'gemini-3.1-flash-tts-preview',
].filter(Boolean);

function sanitizeMaleVoice(name) {
  const voice = String(name || '').trim();
  return MALE_VOICES.has(voice) ? voice : 'Charon';
}

function unique(list) {
  return [...new Set(list)];
}

function pcm16ToWavBuffer(pcmBuffer, sampleRate = 24000) {
  let pcm = pcmBuffer;
  if (pcm.length % 2 === 1) pcm = Buffer.concat([pcm, Buffer.from([0])]);
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

function parseSampleRate(mime = '') {
  const m = String(mime).match(/rate=(\d+)/i);
  const rate = m ? Number(m[1]) : 24000;
  return rate > 0 ? rate : 24000;
}

function voiceForLang(lang) {
  return lang === 'ar' ? DEFAULT_VOICE_AR : DEFAULT_VOICE_EN;
}

function buildSpeakPrompt(text, lang) {
  if (lang === 'ar') {
    return [
      'You are GoGo, a friendly Egyptian man from Cairo working at Samsung Egypt.',
      'Speak ONLY Egyptian colloquial Arabic (عامية مصرية) — never formal MSA, never Gulf/Levantine.',
      'Natural Cairo tone: warm, clear, adult male. Phrases like: أهلاً، ازيك، تمام، هقولك، دلوقتي، كده، شوف.',
      'Do not translate. Read this Egyptian Arabic aloud exactly:',
      text,
    ].join(' ');
  }
  return `Speak naturally in clear American English with a warm adult male voice. Say: ${text}`;
}

async function synthesizeWithGemini({ text, lang, apiKey, voice }) {
  const models = unique(GEMINI_TTS_MODELS);
  let lastErr = null;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildSpeakPrompt(text, lang) }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data?.error?.message || `Gemini TTS HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find((p) => p?.inlineData?.data || p?.inline_data?.data);
      const inline = audioPart?.inlineData || audioPart?.inline_data;
      if (!inline?.data) throw new Error('Empty Gemini TTS audio');
      const mime = inline.mimeType || inline.mime_type || 'audio/L16;codec=pcm;rate=24000';
      const pcm = Buffer.from(inline.data, 'base64');
      if (pcm.length < 2000) throw new Error('Gemini TTS audio too short');
      const wav = pcm16ToWavBuffer(pcm, parseSampleRate(mime));
      return {
        audioBase64: wav.toString('base64'),
        mimeType: 'audio/wav',
        voice,
        model,
        source: 'gemini-tts',
        gender: 'male',
      };
    } catch (err) {
      lastErr = err;
      const retryable =
        err?.status === 429 ||
        err?.status === 404 ||
        /quota|not found|unavailable|too short|empty/i.test(err?.message || '');
      if (!retryable) break;
    }
  }
  throw lastErr || new Error('Gemini TTS unavailable');
}

export async function POST(request) {
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

  // Permanent free path: Microsoft Edge Egyptian male (ar-EG-ShakirNeural).
  // No API key / no subscription — works offline-capable via Edge neural service.
  try {
    const audio = await synthesizeWithEdgeTts(text, lang);
    return NextResponse.json({
      ...audio,
      lang,
      text,
    });
  } catch (edgeErr) {
    console.warn('GoGo Edge TTS failed:', edgeErr?.message || edgeErr);
  }

  // Optional paid: ElevenLabs Hanafi — only when explicitly enabled (free plan cannot use library voices).
  const elevenEnabled = process.env.ELEVENLABS_ENABLED === '1' || process.env.ELEVENLABS_ENABLED === 'true';
  if (elevenEnabled && lang === 'ar' && isElevenLabsConfigured('ar')) {
    try {
      const audio = await synthesizeWithElevenLabs(text, 'ar');
      return NextResponse.json({
        ...audio,
        lang,
        text,
      });
    } catch (elevenErr) {
      console.warn('GoGo ElevenLabs Hanafi TTS failed:', elevenErr?.message || elevenErr);
    }
  }

  // Secondary: Gemini TTS only if key exists and quota allows
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const audio = await synthesizeWithGemini({
        text,
        lang,
        apiKey,
        voice: voiceForLang(lang),
      });
      return NextResponse.json({
        ...audio,
        lang,
        text,
      });
    } catch (err) {
      console.warn('GoGo Gemini TTS failed:', err?.message || err);
    }
  }

  return NextResponse.json(
    { error: 'Voice temporarily unavailable', fallback: true, code: 'tts_failed' },
    { status: 503 },
  );
}
