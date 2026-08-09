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

/**
 * @returns {{ start: () => void, stop: () => void, supported: boolean } | null}
 */
export function createGoGoRecognizer({ lang = 'en', onResult, onError, onEnd, onStart } = {}) {
  if (!isSpeechRecognitionSupported()) return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Ctor();
  recognition.lang = speechLocaleForLang(lang);
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => onStart?.();
  recognition.onerror = (ev) => onError?.(ev?.error || 'speech_error');
  recognition.onend = () => onEnd?.();
  recognition.onresult = (event) => {
    let interim = '';
    let finalText = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const piece = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) finalText += piece;
      else interim += piece;
    }
    onResult?.({
      interim: interim.trim(),
      final: finalText.trim(),
    });
  };

  return {
    supported: true,
    start() {
      try {
        recognition.lang = speechLocaleForLang(lang);
        recognition.start();
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

/**
 * Speak GoGo reply. Picks a matching voice when available.
 * @returns {Promise<void>}
 */
export function speakGoGoText(text, { lang = 'en', muted = false, onStart, onEnd } = {}) {
  return new Promise((resolve) => {
    if (muted || !isSpeechSynthesisSupported()) {
      resolve();
      return;
    }
    const clean = String(text || '')
      .replace(/[👋👇💭👉]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
    if (!clean) {
      resolve();
      return;
    }

    stopGoGoSpeech();
    const utter = new window.SpeechSynthesisUtterance(clean);
    utter.lang = speechLocaleForLang(lang);
    utter.rate = lang === 'ar' ? 0.95 : 1;
    utter.pitch = 1;

    try {
      const voices = window.speechSynthesis.getVoices?.() || [];
      const locale = speechLocaleForLang(lang).toLowerCase();
      const match =
        voices.find((v) => (v.lang || '').toLowerCase() === locale) ||
        voices.find((v) => (v.lang || '').toLowerCase().startsWith(lang === 'ar' ? 'ar' : 'en'));
      if (match) utter.voice = match;
    } catch { /* ignore */ }

    utter.onstart = () => onStart?.();
    utter.onend = () => {
      onEnd?.();
      resolve();
    };
    utter.onerror = () => {
      onEnd?.();
      resolve();
    };

    // Chrome sometimes needs getVoices warm-up
    try {
      window.speechSynthesis.getVoices();
    } catch { /* ignore */ }

    window.speechSynthesis.speak(utter);
  });
}
