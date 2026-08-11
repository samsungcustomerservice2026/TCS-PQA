/**
 * Microsoft Edge neural TTS (no API key).
 * Used as GoGo's reliable male voice path when Gemini TTS is unavailable.
 *
 * Loaded via createRequire so Next/webpack does not fail to resolve the
 * CommonJS package during the client-adjacent compile graph.
 */

import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

const require = createRequire(import.meta.url);

const VOICE_EN = process.env.GOGO_EDGE_VOICE_EN || 'en-US-AndrewNeural';
/** Egyptian Arabic male neural voice (Microsoft Edge) — free & permanent. */
const VOICE_AR = process.env.GOGO_EDGE_VOICE_AR || 'ar-EG-ShakirNeural';
/** Clear educational pacing (Hanafi-like confidence without paid API). */
const RATE_AR = process.env.GOGO_EDGE_RATE_AR || '+8%';
const RATE_EN = process.env.GOGO_EDGE_RATE_EN || '+0%';
const PITCH_AR = process.env.GOGO_EDGE_PITCH_AR || '-2Hz';
const PITCH_EN = process.env.GOGO_EDGE_PITCH_EN || '+0Hz';

export function edgeVoiceForLang(lang) {
  return lang === 'ar' ? VOICE_AR : VOICE_EN;
}

function loadEdgeTTS() {
  // Keep the package out of the webpack graph (serverExternalPackages + ignore).
  // eslint-disable-next-line import/no-commonjs
  const mod = require(/* webpackIgnore: true */ 'node-edge-tts');
  const EdgeTTS = mod?.EdgeTTS || mod?.default?.EdgeTTS || mod?.default;
  if (!EdgeTTS) {
    throw new Error('node-edge-tts EdgeTTS export missing');
  }
  return EdgeTTS;
}

/**
 * @returns {Promise<{ audioBase64: string, mimeType: string, voice: string, source: string }>}
 */
export async function synthesizeWithEdgeTts(text, lang = 'en') {
  const EdgeTTS = loadEdgeTTS();
  const voice = edgeVoiceForLang(lang);
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const rate = lang === 'ar' ? RATE_AR : RATE_EN;
  const pitch = lang === 'ar' ? PITCH_AR : PITCH_EN;
  const tmp = path.join(os.tmpdir(), `gogo-tts-${randomUUID()}.mp3`);

  try {
    const tts = new EdgeTTS({
      voice,
      lang: locale,
      rate,
      pitch,
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      timeout: 20000,
    });
    await tts.ttsPromise(String(text || ''), tmp);
    const buf = fs.readFileSync(tmp);
    if (!buf?.length || buf.length < 500) {
      throw new Error('Empty Edge TTS audio');
    }
    return {
      audioBase64: buf.toString('base64'),
      mimeType: 'audio/mpeg',
      voice,
      source: 'edge-neural',
      gender: 'male',
      locale,
      dialect: lang === 'ar' ? 'egyptian' : 'en-us',
    };
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}
