/**
 * GoGo reply animation tags drive the on-screen avatar.
 * Tags are stripped from chat UI and TTS.
 */

export const GOGO_STATE_TAGS = [
  'idle',
  'thinking',
  'typing',
  'explaining',
  'pointing',
  'success',
  'empathetic',
  'wave',
  'celebrate',
  'error',
  'listening',
];

const TAG_RE =
  /\[(idle|thinking|typing|explaining|pointing|success|empathetic|wave|celebrate|laugh|error|listening)\]/gi;

/** Map animation state → GoGo pose id (CSS / sprite). */
export const GOGO_STATE_TO_POSE = {
  idle: 'idle',
  thinking: 'think',
  typing: 'typing',
  explaining: 'explaining',
  pointing: 'point',
  success: 'success',
  empathetic: 'empathetic',
  wave: 'wave',
  celebrate: 'celebrate',
  laugh: 'celebrate',
  error: 'error',
  listening: 'listening',
};

export function normalizeGoGoState(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (s === 'laugh') return 'celebrate';
  return GOGO_STATE_TAGS.includes(s) ? s : 'explaining';
}

export function poseFromGoGoState(state) {
  return GOGO_STATE_TO_POSE[normalizeGoGoState(state)] || 'explaining';
}

/** Strip animation tags for display / speech. */
export function stripGoGoStateTags(text) {
  return String(text || '')
    .replace(TAG_RE, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?؟])/g, '$1')
    .trim();
}

/**
 * Light client-side mood guess when the model forgets tags.
 * Prefer model tags; this is only a fallback.
 */
export function inferGoGoStateFromText(text, { denied = false } = {}) {
  const t = String(text || '');
  if (denied) return 'empathetic';
  if (/sorry|apolog|unfortunately|frustrating|آسف|للأسف|معلش|متعذر/i.test(t)) return 'empathetic';
  if (/error|failed|couldn't|cannot|مش قادر|خطأ|فشل/i.test(t)) return 'error';
  if (/tap|click|open|go to|press|اضغط|روح|افتح|من هنا/i.test(t)) return 'pointing';
  if (/welcome|hello|hi\b|أهلا|مرحبا|هاي/i.test(t)) return 'wave';
  if (/great|done|perfect|all set|awesome|تمام|ممتاز|جاهز|bravo/i.test(t)) return 'success';
  if (/congrats|celebrat|won|haha|hehe|هههه|يلاا|مبروك|سر\s*صغير|little secret/i.test(t)) return 'celebrate';
  if (/step|first|second|how to|calculate|means|يعني|خطوة|احسب/i.test(t)) return 'explaining';
  if (/let me|checking|hmm|moment|لحظة|بفكر|خليني/i.test(t)) return 'thinking';
  if (/list|write|here are|كالتالي|هكتب/i.test(t)) return 'typing';
  return 'explaining';
}

/**
 * Parse a model reply that may contain leading / mid-sentence [STATE_TAG]s.
 */
export function parseGoGoStateTaggedText(raw, opts = {}) {
  const source = String(raw || '');
  const matches = [...source.matchAll(TAG_RE)];

  if (!matches.length) {
    const displayText = source.trim();
    const guessed = inferGoGoStateFromText(displayText, opts);
    return {
      displayText,
      initialState: guessed,
      segments: displayText ? [{ state: guessed, text: displayText }] : [],
    };
  }

  /** @type {Array<{ state: string, text: string }>} */
  const segments = [];
  let cursor = 0;
  let pendingState = null;

  for (const match of matches) {
    const idx = match.index ?? 0;
    const before = source.slice(cursor, idx).trim();
    if (before) {
      segments.push({
        state: normalizeGoGoState(pendingState || 'explaining'),
        text: before,
      });
    }
    pendingState = normalizeGoGoState(match[1]);
    cursor = idx + match[0].length;
  }

  const tail = source.slice(cursor).trim();
  if (tail || pendingState) {
    segments.push({
      state: normalizeGoGoState(pendingState || 'explaining'),
      text: tail,
    });
  }

  const cleaned = segments.filter((s) => s.text);
  const displayText = cleaned.map((s) => s.text).join(' ').replace(/\s{2,}/g, ' ').trim();
  const initialState = cleaned[0]?.state || normalizeGoGoState(pendingState) || 'explaining';

  return {
    displayText,
    initialState,
    segments: cleaned.length ? cleaned : [{ state: initialState, text: displayText }],
  };
}

/**
 * Rough timeline for mid-reply pose changes while TTS plays.
 */
export function buildGoGoStateTimeline(segments, { msPerChar = 52, minHold = 450, maxHold = 4200 } = {}) {
  const list = Array.isArray(segments) ? segments : [];
  let at = 0;
  return list.map((seg) => {
    const pose = poseFromGoGoState(seg.state);
    const entry = { pose, atMs: at, state: normalizeGoGoState(seg.state) };
    const hold = Math.max(minHold, Math.min(maxHold, String(seg.text || '').length * msPerChar));
    at += hold;
    return entry;
  });
}

/**
 * Finish incomplete model replies (e.g. "Let me know if you") so GoGo never ends mid-thought.
 */
export function ensureGoGoCompleteReply(text) {
  let t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return t;

  // Drop dangling unfinished closers / CTAs
  t = t
    .replace(
      /\s*(Let me know if you(?:\s+\w+){0,6}|If you(?:'d| would)? like(?:\s+\w+){0,8}|Feel free to(?:\s+\w+){0,6}|Would you like(?:\s+\w+){0,8}|لو حابب(?:\s+\S+){0,8}|هل تريد(?:\s+\S+){0,8})\s*[.!…]*$/i,
      '',
    )
    .trim();

  // Truncated mid-word / mid-phrase without ending punctuation
  if (t && !/[.!?؟…]"?$/.test(t)) {
    // If it looks cut mid-sentence, close cleanly without inventing a new CTA
    t = `${t.replace(/[,:;–—-]\s*$/, '').trim()}.`;
  }

  return t;
}
export function buildGoGoStateTagPromptRules() {
  return [
    'Avatar body language (required — feel the moment):',
    'You are a live on-screen avatar. Act natural: pick the expression that matches how you FEEL in each beat of the reply.',
    'Start EVERY reply with one animation tag. Add more mid-reply whenever mood or action shifts — do not stay stuck on one pose.',
    'Allowed tags: [idle] [thinking] [typing] [explaining] [pointing] [success] [empathetic] [wave] [celebrate] [laugh] [error] [listening]',
    '- [idle]: calm / neutral beat',
    '- [wave]: greetings, hello, welcome back',
    '- [listening]: acknowledging the visitor (“got it”, “I hear you”)',
    '- [thinking]: figuring something out, pausing, troubleshooting',
    '- [typing]: listing steps or drafting a short plan',
    '- [explaining]: teaching / breaking something down (open hands)',
    '- [pointing]: directing them to a button, tab, chip, or place on screen',
    '- [success]: confirmation, “you’re set”, positive outcome (thumbs up)',
    '- [celebrate] / [laugh]: joy, joke punchline, playful secret, funny ending',
    '- [empathetic]: sorry, soft reassurance, frustration care',
    '- [error]: something went wrong / blocked path (shocked / stumble feel)',
    'Be expressive and varied — greet with [wave], think with [thinking], teach with [explaining], guide UI with [pointing], finish with [success] when it fits.',
    'CRITICAL completeness: NEVER end mid-sentence. NEVER leave unfinished CTAs like “Let me know if you”. Every reply must finish with a complete thought and proper punctuation.',
    'Format: [STATE_TAG] Sentence. [OPTIONAL_STATE_TAG] Next beat.',
    'Example: [wave] Hey! [thinking] Let me check that… [explaining] TCS MX weights KPIs at 50%. [success] You’re good to go.',
    'Example: [empathetic] Sorry that was confusing. [pointing] Tap Search on the home screen.',
    'Never invent other bracket tags. Never explain the tags to the visitor.',
  ].join('\n');
}
