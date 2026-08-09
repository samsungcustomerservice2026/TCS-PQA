/**
 * GoGo STT + TTS helpers.
 *
 * Stable adult-male casting:
 * - English → Gemini Charon (native US male), browser male fallback
 * - Arabic → native browser Arabic male first (Hamed / Neural), Gemini fallback
 *
 * Chosen browser voices are pinned in localStorage so the same “guy” stays stable.
 * Chrome / Edge recommended. Graceful no-ops when unsupported.
 */

const VOICE_MUTE_KEY = 'gogo_voice_muted';
const PINNED_VOICE_KEY = {
  en: 'gogo_pinned_voice_en',
  ar: 'gogo_pinned_voice_ar',
};

/** Incremented on every stop/cancel so in-flight speak loops abort. */
let speechGeneration = 0;
let currentAudio = null;

export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  if (typeof window === 'undefined') return false;
  return (
    typeof Audio !== 'undefined' ||
    (typeof window.speechSynthesis !== 'undefined' &&
      typeof window.SpeechSynthesisUtterance !== 'undefined')
  );
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
  } catch {
    /* ignore */
  }
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
    if (code === 'aborted') return;
    onError?.(code);
  };

  recognition.onend = () => {
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
          try {
            recognition.stop();
          } catch {
            /* ignore */
          }
        }
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
      } catch {
        /* ignore */
      }
    },
    abort() {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    },
  };
}

function stopCurrentAudio() {
  if (!currentAudio) return;
  try {
    currentAudio.pause();
    currentAudio.src = '';
  } catch {
    /* ignore */
  }
  currentAudio = null;
}

function stopBrowserSpeech() {
  if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') return;
  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
    }
  } catch {
    /* ignore */
  }
}

/** Hard-stop speech and invalidate any in-flight speak loops (fixes EN↔AR bugs). */
export function stopGoGoSpeech() {
  speechGeneration += 1;
  stopCurrentAudio();
  stopBrowserSpeech();
}

function getPinnedVoiceKey(lang) {
  return PINNED_VOICE_KEY[lang === 'ar' ? 'ar' : 'en'];
}

function readPinnedVoiceId(lang) {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(getPinnedVoiceKey(lang)) || '';
  } catch {
    return '';
  }
}

function writePinnedVoiceId(lang, voice) {
  if (typeof window === 'undefined' || !voice) return;
  const id = voice.voiceURI || voice.name || '';
  if (!id) return;
  try {
    localStorage.setItem(getPinnedVoiceKey(lang), id);
  } catch {
    /* ignore */
  }
}

function scoreMaleVoice(voice, lang) {
  const name = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
  const vLang = (voice.lang || '').toLowerCase();
  const want = lang === 'ar' ? 'ar' : 'en';
  if (!vLang.startsWith(want)) return -1000;

  let score = 0;
  const maleHints =
    /male|man|guy|david|mark|james|john|daniel|alex|fred|tom|ryan|eric|george|richard|christopher|microsoft david|microsoft mark|microsoft guy|google us english male|google uk english male|hamed|naayf|maged|farid/;
  const femaleHints =
    /female|woman|zira|hazel|susan|samantha|karen|moira|aria|jenny|sonia|sara|salma|heera|tessa|fiona|victoria|linda|catherine|hoda|laila/;

  if (maleHints.test(name)) score += 80;
  if (femaleHints.test(name)) score -= 90;

  if (lang === 'en') {
    if (vLang === 'en-us') score += 40;
    else if (vLang.startsWith('en')) score += 10;
    if (/google.*english.*male|microsoft.*(guy|david|mark|ryan)/.test(name)) score += 35;
    if (/natural|neural|online|premium/.test(name)) score += 25;
  } else {
    // Prefer the natural Arabic male voices Windows/Edge usually ships
    if (/microsoft.*(hamed|naayf)|google.*(arabic|مصر|egypt).*male|hamed|naayf|maged|farid/.test(name)) {
      score += 70;
    }
    if (vLang.includes('eg') || /egypt|مصر/.test(name)) score += 35;
    else if (vLang.includes('sa') || vLang.includes('xa')) score += 15;
    if (/natural|neural|online|premium/.test(name)) score += 30;
    if (/male/.test(name)) score += 20;
  }

  if (/compact|espeak|robot|novelty|whisper|child|kids/.test(name)) score -= 60;
  return score;
}

function findVoiceById(voices, id) {
  if (!id) return null;
  return voices.find((v) => v.voiceURI === id || v.name === id) || null;
}

function pickAdultMaleVoice(lang, { requireGoodArabic = false } = {}) {
  try {
    const voices = window.speechSynthesis.getVoices?.() || [];
    if (!voices.length) return null;

    const pinnedId = readPinnedVoiceId(lang);
    const pinned = findVoiceById(voices, pinnedId);
    if (pinned && scoreMaleVoice(pinned, lang) > -500) {
      return pinned;
    }

    let best = null;
    let bestScore = -9999;
    voices.forEach((v) => {
      const s = scoreMaleVoice(v, lang);
      if (s > bestScore) {
        bestScore = s;
        best = v;
      }
    });

    // For Arabic, only claim a “good” native voice when score is solid
    if (requireGoodArabic && bestScore < 40) return null;
    if (bestScore <= -500) return null;
    if (best) writePinnedVoiceId(lang, best);
    return best;
  } catch {
    return null;
  }
}

function hasGoodArabicBrowserVoice() {
  try {
    const voices = window.speechSynthesis.getVoices?.() || [];
    return voices.some((v) => scoreMaleVoice(v, 'ar') >= 40);
  } catch {
    return false;
  }
}

/** Clean reply text for spoken delivery (safe on server + client). */
export function textForSpeech(text, lang = 'en') {
  let s = String(text || '');
  s = s
    .replace(/[👋👇💭👉✨🎯📌✅❌•·]/gu, ' ')
    .replace(/\*\*|__/g, '')
    .replace(/`+/g, '')
    .replace(/\([^)]{0,40}\)/g, ' ')
    .replace(/\[[^\]]{0,40}\]/g, ' ')
    .replace(/[←→➡︎⟶]/g, ', ')
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([.!?])\1+/g, '$1')
    .trim();

  if (s.length > 320) {
    const cut = s.slice(0, 320);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('؟'));
    s = (lastStop > 80 ? cut.slice(0, lastStop + 1) : cut).trim();
  }

  if (!s && lang === 'ar') s = 'تمام';
  if (!s) s = 'Okay';
  return s;
}

function waitForVoices(timeoutMs = 1000) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
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

function speakChunk(text, { lang, voice, rate, pitch, generation }) {
  return new Promise((resolve) => {
    if (generation !== speechGeneration) {
      resolve(false);
      return;
    }
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = speechLocaleForLang(lang);
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = 1;
    if (voice) {
      const vLang = (voice.lang || '').toLowerCase();
      const want = lang === 'ar' ? 'ar' : 'en';
      if (vLang.startsWith(want)) utter.voice = voice;
    }

    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    utter.onend = () => finish(generation === speechGeneration);
    utter.onerror = () => finish(false);

    try {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      window.speechSynthesis.speak(utter);
    } catch {
      finish(false);
    }
  });
}

async function fetchGeminiSpeech(text, lang) {
  const response = await fetch('/api/gogo/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.audioBase64) {
    const err = new Error(data?.error || 'Gemini TTS unavailable');
    err.code = data?.code || 'tts_failed';
    throw err;
  }
  return data;
}

function playBase64Audio(audioBase64, mimeType, generation) {
  return new Promise((resolve) => {
    if (generation !== speechGeneration || typeof Audio === 'undefined') {
      resolve(false);
      return;
    }
    stopCurrentAudio();
    const audio = new Audio(`data:${mimeType || 'audio/wav'};base64,${audioBase64}`);
    currentAudio = audio;
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      if (currentAudio === audio) currentAudio = null;
      resolve(Boolean(ok) && generation === speechGeneration);
    };
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    audio.play().catch(() => finish(false));
  });
}

async function speakWithBrowser(clean, lang, generation, onStart, { requireGoodArabic = false } = {}) {
  if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
    return false;
  }
  if (generation !== speechGeneration) return false;

  await waitForVoices();
  if (generation !== speechGeneration) return false;

  const voice = pickAdultMaleVoice(lang, { requireGoodArabic });
  if (requireGoodArabic && !voice) return false;

  const rate = lang === 'ar' ? 0.95 : 0.96;
  const pitch = lang === 'ar' ? 0.95 : 0.9;
  const parts = clean
    .split(/(?<=[.!?؟])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 6);
  const chunks = parts.length ? parts : [clean];

  let started = false;
  for (let i = 0; i < chunks.length; i += 1) {
    if (generation !== speechGeneration) return false;
    if (!started) {
      started = true;
      onStart?.();
    }
    // eslint-disable-next-line no-await-in-loop
    const ok = await speakChunk(chunks[i], { lang, voice, rate, pitch, generation });
    if (!ok || generation !== speechGeneration) return false;
    if (i < chunks.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 90));
    }
  }
  return generation === speechGeneration;
}

async function speakWithGemini(clean, lang, generation, onStart) {
  const data = await fetchGeminiSpeech(clean, lang);
  if (generation !== speechGeneration) return false;
  onStart?.();
  return playBase64Audio(data.audioBase64, data.mimeType, generation);
}

/**
 * Speak GoGo reply with a stable adult-male cast per language.
 * Safe across EN↔AR switches via speechGeneration token.
 */
export async function speakGoGoText(text, { lang = 'en', muted = false, onStart, onEnd } = {}) {
  if (muted) {
    onEnd?.();
    return;
  }

  const L = lang === 'ar' ? 'ar' : 'en';
  const clean = textForSpeech(text, L);
  if (!clean || typeof window === 'undefined') {
    onEnd?.();
    return;
  }

  stopGoGoSpeech();
  const generation = speechGeneration;
  await new Promise((r) => setTimeout(r, 60));
  if (generation !== speechGeneration) {
    onEnd?.();
    return;
  }

  let started = false;
  const markStart = () => {
    if (started) return;
    started = true;
    onStart?.();
  };

  // Arabic: restore the natural local Arabic male first (was better than Gemini).
  // English: keep Gemini Charon as the stable US male guide.
  if (L === 'ar') {
    await waitForVoices();
    if (generation !== speechGeneration) {
      onEnd?.();
      return;
    }
    if (hasGoodArabicBrowserVoice()) {
      const ok = await speakWithBrowser(clean, L, generation, markStart, { requireGoodArabic: true });
      if (ok) {
        onEnd?.();
        return;
      }
    }
    try {
      const ok = await speakWithGemini(clean, L, generation, markStart);
      if (ok) {
        onEnd?.();
        return;
      }
    } catch {
      // fall through
    }
    await speakWithBrowser(clean, L, generation, markStart);
    onEnd?.();
    return;
  }

  try {
    const ok = await speakWithGemini(clean, L, generation, markStart);
    if (ok) {
      onEnd?.();
      return;
    }
  } catch {
    // fall through to browser TTS
  }

  if (generation !== speechGeneration) {
    onEnd?.();
    return;
  }

  await speakWithBrowser(clean, L, generation, markStart);
  onEnd?.();
}
