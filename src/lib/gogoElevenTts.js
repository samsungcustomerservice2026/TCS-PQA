/**
 * ElevenLabs TTS — Arabic uses Egyptian male "Hanafi" by default.
 * Preview sample lives at /gogo/voice_preview_hanafi.mp3
 *
 * Requires ELEVENLABS_API_KEY in .env.local (server-only).
 */

const HANAFI_VOICE_ID = 'DWMVT5WflKt0P8OPpIrY';
const DEFAULT_VOICE_AR = process.env.ELEVENLABS_VOICE_AR || HANAFI_VOICE_ID;
const DEFAULT_VOICE_EN = process.env.ELEVENLABS_VOICE_EN || '';
const DEFAULT_MODEL = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

export function elevenVoiceForLang(lang) {
  return lang === 'ar' ? DEFAULT_VOICE_AR : DEFAULT_VOICE_EN;
}

export function isElevenLabsConfigured(lang = 'ar') {
  if (!process.env.ELEVENLABS_API_KEY) return false;
  if (lang === 'ar') return Boolean(DEFAULT_VOICE_AR);
  return Boolean(DEFAULT_VOICE_EN);
}

/**
 * @returns {Promise<{ audioBase64: string, mimeType: string, voice: string, source: string, gender: string, dialect?: string }>}
 */
export async function synthesizeWithElevenLabs(text, lang = 'en') {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY missing');

  const voiceId = elevenVoiceForLang(lang);
  if (!voiceId) throw new Error(`ElevenLabs voice not configured for ${lang}`);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: String(text || '').trim(),
      model_id: DEFAULT_MODEL,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.35,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(detail || `ElevenLabs TTS HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length < 500) {
    throw new Error('Empty ElevenLabs TTS audio');
  }

  return {
    audioBase64: buf.toString('base64'),
    mimeType: 'audio/mpeg',
    voice: voiceId === HANAFI_VOICE_ID ? 'Hanafi' : voiceId,
    voiceId,
    source: 'elevenlabs',
    gender: 'male',
    dialect: lang === 'ar' ? 'egyptian-hanafi' : 'en',
    previewUrl: lang === 'ar' ? '/gogo/voice_preview_hanafi.mp3' : undefined,
  };
}

export const GOGO_HANAFI_VOICE = {
  id: HANAFI_VOICE_ID,
  name: 'Hanafi',
  previewUrl: '/gogo/voice_preview_hanafi.mp3',
  locale: 'ar-EG',
  description: 'Clear confident Egyptian male — educational / assistant tone',
};
