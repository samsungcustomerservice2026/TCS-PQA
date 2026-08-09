/**
 * Microsoft Edge neural TTS (no API key).
 * Used as GoGo's reliable male voice path when Gemini TTS is unavailable.
 */

import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

const VOICE_EN = process.env.GOGO_EDGE_VOICE_EN || 'en-US-AndrewNeural';
const VOICE_AR = process.env.GOGO_EDGE_VOICE_AR || 'ar-EG-ShakirNeural';

export function edgeVoiceForLang(lang) {
  return lang === 'ar' ? VOICE_AR : VOICE_EN;
}

/**
 * @returns {Promise<{ audioBase64: string, mimeType: string, voice: string, source: string }>}
 */
export async function synthesizeWithEdgeTts(text, lang = 'en') {
  const voice = edgeVoiceForLang(lang);
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const tmp = path.join(os.tmpdir(), `gogo-tts-${randomUUID()}.mp3`);

  try {
    const tts = new EdgeTTS({
      voice,
      lang: locale,
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
    };
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}
