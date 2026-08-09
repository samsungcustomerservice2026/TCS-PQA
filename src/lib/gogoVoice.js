/**
 * Browser Web Speech helpers for GoGo (STT + TTS).
 * Chrome / Edge recommended. Graceful no-ops when unsupported.
 */

const VOICE_MUTE_KEY = 'gogo_voice_muted';

export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  if (typeof window === 'undefined') return false;
  return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
}

export function getGoGoVoiceMuted() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(VOICE_MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setGoGoVoiceMuted(muted) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_MUTE_KEY, muted ? '1' : '0');
  } catch { /* ignore */ }
}

export function speechLocaleForLang(lang) {
  return lang === 'ar' ? 'ar-EG' : 'en-US';
}

/** Unlock microphone permission (needed before SpeechRecognition on many browsers). */
export async function ensureMicrophonePermission() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { ok: isSpeechRecognitionSupported(), error: null };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true, error: null };
  } catch (err) {
    const name = err?.name || 'MicError';
    return { ok: false, error: name };
  }
}

/**
 * @returns {{ start: () => void, stop: () => void, abort: () => void, supported: boolean } | null}
 */
export function createGoGoRecognizer({ lang = 'en', onResult, onError, onEnd, onStart } = {}) {
  if (!isSpeechRecognitionSupported()) return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Ctor();
  recognition.lang = speechLocaleForLang(lang);
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let lastInterim = '';
  let gotFinal = false;
  let started = false;

  recognition.onstart = () => {
    started = true;
    gotFinal = false;
    lastInterim = '';
    onStart?.();
  };

  recognition.onerror = (ev) => {
    const code = ev?.error || 'speech_error';
    // Ignore benign abort/no-speech if we already have text
    if (code === 'aborted') return;
    onError?.(code);
  };

  recognition.onend = () => {
    // Chrome often ends without isFinal — use last interim
    if (!gotFinal && lastInterim) {
      onResult?.({ interim: '', final: lastInterim });
    }
    onEnd?.({ gotFinal, lastInterim });
    started = false;
  };

  recognition.onresult = (event) => {
    let interim = '';
    let finalText = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const piece = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) finalText += piece;
      else interim += piece;
    }
    if (interim.trim()) lastInterim = interim.trim();
    if (finalText.trim()) {
      gotFinal = true;
      lastInterim = finalText.trim();
      onResult?.({ interim: '', final: finalText.trim() });
    } else if (interim.trim()) {
      onResult?.({ interim: interim.trim(), final: '' });
    }
  };

  return {
    supported: true,
    start() {
      try {
        recognition.lang = speechLocaleForLang(lang);
        if (started) {
          try { recognition.stop(); } catch { /* ignore */ }
        }
        // Tiny delay helps after stop/cancel TTS
        setTimeout(() => {
          try {
            recognition.start();
          } catch (err) {
            onError?.(err?.message || 'start_failed');
          }
        }, 80);
      } catch (err) {
        onError?.(err?.message || 'start_failed');
      }
    },
    stop() {
      try {
        recognition.stop();
      } catch { /* ignore */ }
    },
    abort() {
      try {
        recognition.abort();
      } catch { /* ignore */ }
    },
  };
}

export function stopGoGoSpeech() {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch { /* ignore */ }
}

function scoreVoice(voice, lang) {
  const name = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
  const vLang = (voice.lang || '').toLowerCase();
  const want = lang === 'ar' ? 'ar' : 'en';
  if (!vLang.startsWith(want)) return -100;

  let score = 10;
  // Prefer natural neural / online Google / Microsoft natural voices
  if (/natural|neural|premium|enhanced|online/.test(name)) score += 40;
  if (/google/.test(name)) score += 35;
  if (/microsoft/.test(name) && /aria|jenny|guy|ryan|sonia|sara|salma|naayf/.test(name)) score += 32;
  if (/samantha|karen|moira|daniel|aaron|fred|tessa|fiona/.test(name)) score += 28;
  if (lang === 'ar' && /egypt|arabic/.test(name)) score += 20;
  if (vLang === speechLocaleForLang(lang).toLowerCase()) score += 15;
  if (/compact|espeak|robot|novelty/.test(name)) score -= 50;
  // Slight preference for warmer-sounding names
  if (/female|aria|jenny|samantha|sonia|sara/.test(name)) score += 6;
  return score;
}

function pickFriendlyVoice(lang) {
  try {
    const voices = window.speechSynthesis.getVoices?.() || [];
    if (!voices.length) return null;
    let best = null;
    let bestScore = -999;
    voices.forEach((v) => {
      const s = scoreVoice(v, lang);
      if (s > bestScore) {
        bestScore = s;
        best = v;
      }
    });
    return bestScore > 0 ? best : null;
  } catch {
    return null;
  }
}

/** Clean reply text for spoken delivery (friendly, not literal UI copy). */
export function textForSpeech(text, lang = 'en') {
  let s = String(text || '');
  s = s
    .replace(/[👋👇💭👉✨🎯📌✅❌•·]/gu, ' ')
    .replace(/\*\*|__/g, '')
    .replace(/`+/g, '')
    .replace(/\([^)]{0,40}\)/g, ' ') // drop short parentheticals like (required)
    .replace(/\[[^\]]{0,40}\]/g, ' ')
    .replace(/[←→➡︎⟶]/g, ', ')
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([.!?])\1+/g, '$1')
    .trim();

  // Keep spoken replies short and conversational
  if (s.length > 320) {
    const cut = s.slice(0, 320);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('؟'));
    s = (lastStop > 80 ? cut.slice(0, lastStop + 1) : cut).trim();
  }

  if (!s && lang === 'ar') s = 'تمام';
  if (!s) s = 'Okay';
  return s;
}

function waitForVoices(timeoutMs = 800) {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve([]);
      return;
    }
    const existing = window.speechSynthesis.getVoices?.() || [];
    if (existing.length) {
      resolve(existing);
      return;
    }
    const done = () => {
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices?.() || []);
    };
    window.speechSynthesis.onvoiceschanged = done;
    setTimeout(done, timeoutMs);
  });
}

/**
 * Speak GoGo reply with a warmer pacing / preferred natural voice.
 * @returns {Promise<void>}
 */
export async function speakGoGoText(text, { lang = 'en', muted = false, onStart, onEnd } = {}) {
  if (muted || !isSpeechSynthesisSupported()) {
    onEnd?.();
    return;
  }

  const clean = textForSpeech(text, lang);
  if (!clean) {
    onEnd?.();
    return;
  }

  await waitForVoices();
  stopGoGoSpeech();

  // Split into short chunks so speech sounds more natural
  const parts = clean
    .split(/(?<=[.!?؟])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 6);

  const chunks = parts.length ? parts : [clean];
  const voice = pickFriendlyVoice(lang);
  let started = false;

  for (let i = 0; i < chunks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      const utter = new window.SpeechSynthesisUtterance(chunks[i]);
      utter.lang = speechLocaleForLang(lang);
      // Slightly slower + warmer than default robot voice
      utter.rate = lang === 'ar' ? 0.92 : 0.94;
      utter.pitch = 1.05;
      utter.volume = 1;
      if (voice) utter.voice = voice;

      utter.onstart = () => {
        if (!started) {
          started = true;
          onStart?.();
        }
      };
      utter.onend = () => resolve();
      utter.onerror = () => resolve();

      try {
        window.speechSynthesis.speak(utter);
      } catch {
        resolve();
      }
    });

    // Tiny pause between sentences
    if (i < chunks.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  onEnd?.();
}
