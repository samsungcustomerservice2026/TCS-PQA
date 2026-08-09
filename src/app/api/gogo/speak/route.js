import { NextResponse } from 'next/server';
import { textForSpeech } from '../../../../lib/gogoVoice';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEXT = 500;

/** Adult male informative guide voice (Gemini prebuilt). */
const DEFAULT_VOICE = process.env.GEMINI_TTS_VOICE || 'Charon';
const DEFAULT_TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';

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
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
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

function buildSpeakPrompt(text, lang) {
  const L = lang === 'ar' ? 'ar' : 'en';
  if (L === 'ar') {
    return [
      'Speak in natural Egyptian/Modern Standard Arabic.',
      'You are GoGo, a friendly adult male Samsung SCORA guide, about 30 years old.',
      'Calm, clear, warm — not robotic.',
      'Say exactly this:',
      text,
    ].join('\n');
  }
  return [
    'Speak in natural native American English (US).',
    'You are GoGo, a friendly adult male Samsung SCORA guide, about 30 years old.',
    'Calm, clear, warm — not robotic, not cartoonish.',
    'Say exactly this:',
    text,
  ].join('\n');
}

async function synthesizeWithGemini({ text, lang, apiKey, model, voice }) {
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

  const model = process.env.GEMINI_TTS_MODEL || DEFAULT_TTS_MODEL;
  const voice = String(body?.voice || DEFAULT_VOICE).slice(0, 40);

  try {
    const audio = await synthesizeWithGemini({ text, lang, apiKey, model, voice });
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
