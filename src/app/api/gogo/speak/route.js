import { NextResponse } from 'next/server';
import { textForSpeech } from '../../../../lib/gogoSpeechText';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEXT = 500;

/** Adult male Gemini voices only. */
const MALE_VOICES = new Set([
  'Charon',
  'Orus',
  'Fenrir',
  'Puck',
  'Enceladus',
  'Iapetus',
  'Umbriel',
  'Algieba',
  'Algenib',
  'Alnilam',
  'Rasalgethi',
  'Schedar',
  'Achird',
  'Zubenelgenubi',
  'Sadachbia',
  'Sadaltager',
]);

const DEFAULT_MALE_VOICE = 'Charon';
const DEFAULT_VOICE_EN = sanitizeMaleVoice(
  process.env.GEMINI_TTS_VOICE_EN || process.env.GEMINI_TTS_VOICE || 'Charon',
);
const DEFAULT_VOICE_AR = sanitizeMaleVoice(
  process.env.GEMINI_TTS_VOICE_AR || process.env.GEMINI_TTS_VOICE || 'Orus',
);

/** Prefer newer/higher-quality TTS first. */
const DEFAULT_TTS_MODELS = [
  process.env.GEMINI_TTS_MODEL,
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-pro-preview-tts',
].filter(Boolean);

function sanitizeMaleVoice(name) {
  const voice = String(name || '').trim();
  if (MALE_VOICES.has(voice)) return voice;
  return DEFAULT_MALE_VOICE;
}

function unique(list) {
  return [...new Set(list)];
}

function pcm16ToWavBuffer(pcmBuffer, sampleRate = 24000) {
  // PCM16 needs even byte length — odd length causes crackling / trash audio
  let pcm = pcmBuffer;
  if (pcm.length % 2 === 1) {
    pcm = Buffer.concat([pcm, Buffer.from([0])]);
  }
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

function voiceForLang(lang, override) {
  if (override) return sanitizeMaleVoice(override);
  return lang === 'ar' ? DEFAULT_VOICE_AR : DEFAULT_VOICE_EN;
}

/** Clean quality cue — no creepy casting notes. */
function buildSpeakPrompt(text, lang) {
  if (lang === 'ar') {
    return `Speak naturally in clear Egyptian Arabic with a warm adult male voice. Say: ${text}`;
  }
  return `Speak naturally in clear American English with a warm adult male voice. Say: ${text}`;
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
  if (pcm.length < 2000) {
    throw new Error('Gemini TTS audio too short');
  }
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
      const retryable =
        err?.status === 429 ||
        err?.status === 404 ||
        /quota|not found|unavailable|too short|empty/i.test(err?.message || '');
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
    console.warn('GoGo speak unavailable: missing server API configuration');
    return NextResponse.json({ error: 'Voice temporarily unavailable', fallback: true }, { status: 503 });
  }

  const voice = voiceForLang(lang, body?.voice);

  try {
    const audio = await synthesizeWithGemini({ text, lang, apiKey, voice });
    return NextResponse.json({
      ...audio,
      source: 'gemini-tts',
      lang,
      text,
      gender: 'male',
    });
  } catch (err) {
    console.warn('GoGo Gemini TTS failed:', err?.message || err);
    return NextResponse.json(
      { error: 'Voice temporarily unavailable', fallback: true, code: 'tts_failed' },
      { status: 503 },
    );
  }
}
