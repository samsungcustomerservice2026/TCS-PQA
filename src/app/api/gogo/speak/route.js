import { NextResponse } from 'next/server';
import { textForSpeech } from '../../../../lib/gogoVoice';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEXT = 500;

/** Stable adult-male Gemini voices (~30). Achird = friendly younger male for Arabic. */
const DEFAULT_VOICE_EN = process.env.GEMINI_TTS_VOICE_EN || process.env.GEMINI_TTS_VOICE || 'Charon';
const DEFAULT_VOICE_AR = process.env.GEMINI_TTS_VOICE_AR || 'Achird';
const DEFAULT_TTS_MODELS = [
  process.env.GEMINI_TTS_MODEL,
  'gemini-2.5-flash-preview-tts',
  'gemini-3.1-flash-tts-preview',
].filter(Boolean);

function unique(list) {
  return [...new Set(list)];
}

function pcm16ToWavBuffer(pcmBuffer, sampleRate = 24000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.length;
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
  return Buffer.concat([header, pcmBuffer]);
}

function parseSampleRate(mime = '') {
  const m = String(mime).match(/rate=(\d+)/i);
  return m ? Number(m[1]) : 24000;
}

function voiceForLang(lang, override) {
  if (override) return String(override).slice(0, 40);
  return lang === 'ar' ? DEFAULT_VOICE_AR : DEFAULT_VOICE_EN;
}

/**
 * Structured director prompt — keeps the same adult-male persona stable.
 * Transcript is clearly labeled so the model does not read the notes aloud.
 */
function buildSpeakPrompt(text, lang) {
  if (lang === 'ar') {
    return [
      'Read aloud the transcript below as natural speech audio only.',
      'Do not read the director notes out loud.',
      '',
      '# DIRECTOR NOTES',
      'Character: GoGo — young adult Egyptian man, exactly 28–32 years old (NOT elderly, NOT 50+, NOT deep old-man gravel).',
      'Language: Natural modern Egyptian Arabic (عامية مصرية شبابية), clear Cairo-style.',
      'Voice quality: Fresh, friendly young-adult male — medium pitch, smooth, energetic but calm.',
      'Avoid: old uncle/grandpa tone, heavy throaty bass, slow elderly pacing, robotic flatness.',
      'Style: Helpful Samsung SCORA visitor guide — warm smile, confident, approachable.',
      'Pacing: Natural conversational young-adult pace.',
      '',
      '# TRANSCRIPT',
      text,
    ].join('\n');
  }

  return [
    'Read aloud the transcript below as natural speech audio only.',
    'Do not read the director notes out loud.',
    '',
    '# DIRECTOR NOTES',
    'Character: GoGo — friendly adult American male guide, about 30 years old.',
    'Language: Native American English (US).',
    'Style: Calm, clear, warm Samsung SCORA visitor guide.',
    'Pacing: Natural conversational pace — not robotic, not cartoonish.',
    'Tone: Confident, helpful, easy to understand.',
    '',
    '# TRANSCRIPT',
    text,
  ].join('\n');
}

async function synthesizeOnce({ text, lang, apiKey, model, voice }) {
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
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
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
  if (!inline?.data) {
    throw new Error('Empty Gemini TTS audio');
  }

  const mime = inline.mimeType || inline.mime_type || 'audio/L16;codec=pcm;rate=24000';
  const pcm = Buffer.from(inline.data, 'base64');
  const sampleRate = parseSampleRate(mime);
  const wav = pcm16ToWavBuffer(pcm, sampleRate);
  return {
    audioBase64: wav.toString('base64'),
    mimeType: 'audio/wav',
    voice,
    model,
  };
}

async function synthesizeWithGemini({ text, lang, apiKey, voice }) {
  const models = unique(DEFAULT_TTS_MODELS);
  let lastErr = null;
  for (const model of models) {
    try {
      return await synthesizeOnce({ text, lang, apiKey, model, voice });
    } catch (err) {
      lastErr = err;
      const retryable = err?.status === 429 || err?.status === 404 || /quota|not found|unavailable/i.test(err?.message || '');
      if (!retryable) throw err;
      console.warn(`GoGo TTS model ${model} failed:`, err.message);
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY missing', fallback: true }, { status: 503 });
  }

  const voice = voiceForLang(lang, body?.voice);

  try {
    const audio = await synthesizeWithGemini({ text, lang, apiKey, voice });
    return NextResponse.json({
      ...audio,
      source: 'gemini-tts',
      lang,
      text,
    });
  } catch (err) {
    console.warn('GoGo Gemini TTS failed:', err?.message || err);
    return NextResponse.json(
      { error: String(err?.message || 'TTS unavailable'), fallback: true },
      { status: 503 },
    );
  }
}
