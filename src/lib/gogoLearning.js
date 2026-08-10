/**
 * GoGo learning helpers — normalize questions, match memory, rotate expressions.
 */

import { GOGO_STATE_TAGS, normalizeGoGoState } from './gogoStateTags';

const EXPRESSION_ROTATION = [
  'explaining',
  'thinking',
  'pointing',
  'success',
  'wave',
  'empathetic',
  'typing',
  'listening',
];

export function normalizeGoGoQuestion(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

export function questionFingerprint(text) {
  const norm = normalizeGoGoQuestion(text);
  // Simple stable hash for doc ids (not crypto-secure — fine for memory keys).
  let h = 0;
  for (let i = 0; i < norm.length; i += 1) {
    h = (h * 31 + norm.charCodeAt(i)) >>> 0;
  }
  return `q_${h.toString(36)}_${norm.slice(0, 24).replace(/\s+/g, '_')}`;
}

export function scoreQuestionOverlap(a, b) {
  const ta = new Set(normalizeGoGoQuestion(a).split(' ').filter((t) => t.length >= 2));
  const tb = new Set(normalizeGoGoQuestion(b).split(' ').filter((t) => t.length >= 2));
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  ta.forEach((t) => {
    if (tb.has(t)) hit += 1;
  });
  return hit / Math.max(ta.size, tb.size);
}

/**
 * Pick best learned entry for a question.
 * Instant recall only when qualityScore >= 100 (fully validated).
 */
export function matchLearnedAnswer(entries, question, lang = 'en') {
  const list = Array.isArray(entries) ? entries : [];
  const L = lang === 'ar' ? 'ar' : 'en';
  let best = null;
  let bestScore = 0;
  for (const row of list) {
    if (row?.status === 'disabled') continue;
    const candidates = [
      row.question,
      row.question_en,
      row.question_ar,
      row.questionNorm,
      ...(Array.isArray(row.keywords) ? row.keywords : []),
    ]
      .filter(Boolean)
      .map(String);
    let score = 0;
    candidates.forEach((c) => {
      score = Math.max(score, scoreQuestionOverlap(question, c));
    });
    const quality = Number(row.qualityScore || 0);
    if (score > bestScore) {
      bestScore = score;
      best = row;
      best._matchScore = score;
      best._quality = quality;
    }
  }
  if (!best || bestScore < 0.55) return null;

  const answer =
    L === 'ar'
      ? String(best.answer_ar || best.answer || best.answer_en || '').trim()
      : String(best.answer_en || best.answer || best.answer_ar || '').trim();
  if (!answer) return null;

  const instant =
    best.status !== 'needs_improve' &&
    Number(best.qualityScore || 0) >= 100 &&
    bestScore >= 0.62;
  return {
    entry: best,
    answer,
    matchScore: bestScore,
    instant,
    preferredStates: Array.isArray(best.preferredStates) ? best.preferredStates : [],
    expressionHint: String(best.expressionHint || ''),
  };
}

export function nextExpressionAfterMiss(previousStates = []) {
  const prev = (Array.isArray(previousStates) ? previousStates : [])
    .map((s) => normalizeGoGoState(s))
    .filter(Boolean);
  const last = prev[prev.length - 1];
  const idx = Math.max(0, EXPRESSION_ROTATION.indexOf(last));
  for (let i = 1; i <= EXPRESSION_ROTATION.length; i += 1) {
    const candidate = EXPRESSION_ROTATION[(idx + i) % EXPRESSION_ROTATION.length];
    if (!prev.includes(candidate)) return candidate;
  }
  return 'explaining';
}

export function buildLearningPromptHints(match) {
  if (!match?.entry) return '';
  const entry = match.entry;
  const lines = [];
  if (entry.status === 'needs_improve' || Number(entry.downvotes || 0) > 0) {
    lines.push('Learning note: a similar answer was rated “needs improvement”.');
    lines.push('Your job is to IMPROVE the answer — not shrink it.');
    lines.push('HARD RULES: write a complete reply (2–5 full sentences). Never truncate mid-sentence. Never answer with a fragment or a one-word cutoff.');
    lines.push('Keep every correct fact; add missing role/detail clarity; make wording friendlier and clearer.');
    if (entry.expressionHint) {
      lines.push(`Use a fresh body-language tag style starting with [${normalizeGoGoState(entry.expressionHint)}].`);
    } else if (Array.isArray(entry.preferredStates) && entry.preferredStates[0]) {
      lines.push(`Use a fresh body-language tag style starting with [${normalizeGoGoState(entry.preferredStates[0])}].`);
    } else {
      lines.push('Change expression tags from last time (e.g. explaining / success / thinking).');
    }
    const prev = String(entry.lastWeakAnswer || '').trim();
    if (prev) {
      if (prev.length < 90 || !/[.!?…]/.test(prev)) {
        lines.push(
          'Previous attempt was incomplete/cut off. Rebuild a FULL answer from the Head Office knowledge block — do not continue that fragment.',
        );
      } else {
        lines.push(
          `Previous attempt (keep its correct facts, rewrite more completely — do NOT copy-paste and do NOT shorten): "${prev.slice(0, 280)}"`,
        );
      }
    }
  }
  return lines.join('\n');
}

export { GOGO_STATE_TAGS };
