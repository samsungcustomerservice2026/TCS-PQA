/**
 * GoGo STT + TTS helpers.
 *
 * Stable adult-male casting (~30) for BOTH languages:
 * - Gemini Charon (male) first for EN + AR
 * - Browser fallback: male voices ONLY (female hard-rejected)
 *
 * Chosen browser voices are pinned in localStorage so the same “guy” stays stable.
 * Chrome / Edge recommended. Graceful no-ops when unsupported.
 */

import { textForSpeech } from './gogoSpeechText';
import { rewriteAssistantNameForBrowserEnglish } from './gogoIdentity';

export { textForSpeech };

const VOICE_MUTE_KEY = 'gogo_voice_muted';
const PINNED_VOICE_KEY = {
  en: 'gogo_pinned_voice_en_v4_male',
  ar: 'gogo_pinned_voice_ar_v5_eg_male',
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

function isFemaleVoiceName(name) {
  return /female|woman|girl|zira|hazel|susan|samantha|karen|moira|aria|jenny|sonia|sara|salma|heera|tessa|fiona|victoria|linda|catherine|hoda|laila|heather|allison|ava|emma|joanna|ivy|salli|kimberly|kendra|olivia|amy|emma|nancy|raveena|aditi|zephyr|kore|aoede|leda|callirrhoe|autonoe|despina|erinome|laomedeia|achernar|pulcherrima|vindemiatrix|sulafat|gacrux/.test(
    name,
  );
}

function isMaleVoiceName(name) {
  return /male|man|guy|david|mark|james|john|daniel|alex|fred|tom|ryan|eric|george|richard|christopher|microsoft david|microsoft mark|microsoft guy|google us english male|google uk english male|hamed|naayf|naayef|maged|farid|charon|orus|fenrir|puck|alnilam|schedar|achird/.test(
    name,
  );
}

function scoreMaleVoice(voice, lang) {
  const name = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
  const vLang = (voice.lang || '').toLowerCase();
  const want = lang === 'ar' ? 'ar' : 'en';
  if (!vLang.startsWith(want)) return -1000;
  // Hard reject female — never cast a woman for GoGo
  if (isFemaleVoiceName(name)) return -1000;

  let score = 0;
  if (isMaleVoiceName(name)) score += 100;
  else score -= 30; // unknown gender: prefer not to use unless nothing else

  if (lang === 'en') {
    if (vLang === 'en-us') score += 40;
    else if (vLang.startsWith('en')) score += 10;
    if (/google.*english.*male|microsoft.*(guy|david|mark|ryan)/.test(name)) score += 35;
    if (/natural|neural|online|premium/.test(name)) score += 25;
  } else {
    // Arabic: hard-prefer Egyptian male (ar-EG / مصر)
    if (/hamed|naayf|naayef|maged|farid|male|shakir/.test(name)) score += 60;
    if (vLang.includes('eg') || /egypt|مصر|cairo|مصري/.test(name)) score += 80;
    else if (vLang.includes('sa') || vLang.includes('xa')) score -= 20;
    else if (vLang.startsWith('ar')) score += 5;
    if (/natural|neural|online|premium/.test(name)) score += 30;
  }

  if (/compact|espeak|robot|novelty|whisper|child|kids/.test(name)) score -= 60;
  return score;
}

function findVoiceById(voices, id) {
  if (!id) return null;
  return voices.find((v) => v.voiceURI === id || v.name === id) || null;
}

function pickAdultMaleVoice(lang) {
  try {
    const voices = window.speechSynthesis.getVoices?.() || [];
    if (!voices.length) return null;

    const pinnedId = readPinnedVoiceId(lang);
    const pinned = findVoiceById(voices, pinnedId);
    // Only keep pin if it is clearly male
    if (pinned && scoreMaleVoice(pinned, lang) >= 40) {
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

    // Require a real male score — never fall back to a female/default woman voice
    if (!best || bestScore < 40) return null;
    writePinnedVoiceId(lang, best);
    return best;
  } catch {
    return null;
  }
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

async function fetchServerSpeech(text, lang) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 25000) : null;
  try {
    const response = await fetch('/api/gogo/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      signal: controller?.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.audioBase64) {
      const err = new Error(data?.error || 'TTS unavailable');
      err.code = data?.code || 'tts_failed';
      throw err;
    }
    return data;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function base64ToBlob(base64, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType || 'audio/wav' });
}

function playBase64Audio(audioBase64, mimeType, generation) {
  return new Promise((resolve) => {
    if (generation !== speechGeneration || typeof Audio === 'undefined') {
      resolve(false);
      return;
    }
    stopCurrentAudio();

    let objectUrl = '';
    try {
      const blob = base64ToBlob(audioBase64, mimeType || 'audio/wav');
      objectUrl = URL.createObjectURL(blob);
    } catch {
      resolve(false);
      return;
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = objectUrl;
    audio.playbackRate = 1;
    audio.volume = 1;
    currentAudio = audio;
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          /* ignore */
        }
      }
      if (currentAudio === audio) currentAudio = null;
      resolve(Boolean(ok) && generation === speechGeneration);
    };
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    const start = () => {
      audio.play().catch(() => finish(false));
    };
    if (audio.readyState >= 2) start();
    else {
      audio.oncanplaythrough = start;
      // Safety if canplay never fires
      setTimeout(() => {
        if (!settled) start();
      }, 400);
    }
  });
}

async function speakWithBrowser(clean, lang, generation, onStart) {
  if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
    return false;
  }
  if (generation !== speechGeneration) return false;

  await waitForVoices();
  if (generation !== speechGeneration) return false;

  const voice = pickAdultMaleVoice(lang);
  // Do not speak with the browser default if it would be female/unknown
  if (!voice) return false;

  // Natural pacing — do not pitch-shift (sounds unnatural)
  const rate = 1;
  const pitch = 1;
  const spoken = lang === 'en' ? rewriteAssistantNameForBrowserEnglish(clean) : clean;
  const parts = spoken
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

async function speakWithServerTts(clean, lang, generation, onStart) {
  const data = await fetchServerSpeech(clean, lang);
  if (generation !== speechGeneration) return false;
  onStart?.();
  return playBase64Audio(data.audioBase64, data.mimeType, generation);
}

/**
 * Speak GoGo reply with a stable adult-male cast per language.
 * Safe across EN↔AR switches via speechGeneration token.
 * Uses Edge TTS via /api/gogo/speak (Gemini removed).
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
  await new Promise((r) => setTimeout(r, 40));
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

  try {
    try {
      const ok = await speakWithServerTts(clean, L, generation, markStart);
      if (ok) return;
    } catch {
      // fall through to browser TTS
    }

    if (generation !== speechGeneration) return;
    await speakWithBrowser(clean, L, generation, markStart);
  } finally {
    onEnd?.();
  }
}
