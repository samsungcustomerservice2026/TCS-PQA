import { QUIZ_DEFAULT_TIME_SEC, QUIZ_QUESTION_TYPES, DEFAULT_QUIZ_SETTINGS } from '../constants/quiz';

export { DEFAULT_QUIZ_SETTINGS };

export const SCORA_CHALLENGE_NAME = 'SCORA Challenge';
export const SCORA_CHALLENGE_NAME_AR = 'تحدي SCORA';

export function normalizeQuizSettings(raw = {}) {
  return {
    ...DEFAULT_QUIZ_SETTINGS,
    ...raw,
    defaultTimeSec: Math.min(120, Math.max(5, parseInt(raw.defaultTimeSec, 10) || QUIZ_DEFAULT_TIME_SEC)),
    revealDelaySec: Math.min(30, Math.max(2, parseInt(raw.revealDelaySec, 10) || 5)),
    showQuestionsOnDevices: raw.showQuestionsOnDevices !== false,
    reactions: raw.reactions !== false,
    highContrast: !!raw.highContrast,
    unlimitedTime: !!raw.unlimitedTime,
    nicknameGenerator: !!raw.nicknameGenerator,
    twoStepJoin: !!raw.twoStepJoin,
    autoRevealWhenAllAnswered: raw.autoRevealWhenAllAnswered !== false,
    autoPlay: !!raw.autoPlay,
    randomizeQuestions: !!raw.randomizeQuestions,
    randomizeAnswers: raw.randomizeAnswers !== false,
    defaultLanguage: ['en', 'ar', 'both'].includes(raw.defaultLanguage) ? raw.defaultLanguage : 'en',
  };
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getFilledOptionIndices(options) {
  return (options || [])
    .map((opt, i) => (String(opt || '').trim() ? i : -1))
    .filter((i) => i >= 0);
}

function shuffleOptionsForQuestion(q) {
  const indices = getFilledOptionIndices(q.options);
  if (!indices.length) return { ...q };

  const shuffled = shuffleArray(indices);
  const newOptions = shuffled.map((i) => q.options[i] || '');
  const newOptionsAr = shuffled.map((i) => q.optionsAr?.[i] || q.options[i] || '');

  if (q.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE) {
    const newCorrectIndices = (q.correctIndices || [])
      .map((ci) => shuffled.indexOf(ci))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    return { ...q, options: newOptions, optionsAr: newOptionsAr, correctIndices: newCorrectIndices };
  }

  const newCorrectIndex = Math.max(0, shuffled.indexOf(q.correctIndex ?? 0));
  return { ...q, options: newOptions, optionsAr: newOptionsAr, correctIndex: newCorrectIndex };
}

export function prepareSessionQuestions(questions, settings) {
  const s = normalizeQuizSettings(settings);
  let ordered = [...(questions || [])];

  if (s.randomizeQuestions) ordered = shuffleArray(ordered);

  if (s.randomizeAnswers) {
    ordered = ordered.map((q) => {
      if (q.type === QUIZ_QUESTION_TYPES.CHOICE || q.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE) {
        return shuffleOptionsForQuestion(q);
      }
      if (q.type === QUIZ_QUESTION_TYPES.POLL) {
        return shuffleOptionsForQuestion({ ...q, correctIndex: 0, correctIndices: [] });
      }
      return { ...q };
    });
  }

  return ordered.map((q) => ({
    ...q,
    timeLimitSec: q.timeLimitSec || s.defaultTimeSec,
  }));
}

export function getQuestionTimeLimit(session, question) {
  const settings = normalizeQuizSettings(session?.settings);
  return question?.timeLimitSec || settings.defaultTimeSec;
}

export function getTimerRemainingMs(session, question) {
  if (!session?.questionStartedAt) return null;
  const limitMs = getQuestionTimeLimit(session, question) * 1000;
  const elapsed = Date.now() - new Date(session.questionStartedAt).getTime();
  return Math.max(0, limitMs - elapsed);
}

export function buildRankMap(players) {
  const map = {};
  (players || []).forEach((p, i) => { map[p.id] = i + 1; });
  return map;
}

export function playersWithRankDelta(players, prevRanks = {}) {
  return (players || []).map((p, i) => {
    const rank = i + 1;
    const prev = prevRanks[p.id];
    const rankDelta = prev != null ? prev - rank : 0;
    return { ...p, rank, rankDelta };
  });
}

export function getCorrectAnswerLabel(question, lang = 'en') {
  if (!question) return '—';
  if (question.type === QUIZ_QUESTION_TYPES.POLL) {
    return lang === 'ar' ? 'استطلاع' : 'Poll';
  }
  if (question.type === QUIZ_QUESTION_TYPES.TRUE_FALSE) {
    const isTrue = (question.correctIndex ?? 0) === 0;
    return lang === 'ar' ? (isTrue ? 'صح' : 'خطأ') : (isTrue ? 'True' : 'False');
  }
  if (question.type === QUIZ_QUESTION_TYPES.TYPE_ANSWER) {
    const answers = [...(question.acceptedAnswers || []), ...(question.acceptedAnswersAr || [])].filter(Boolean);
    return answers[0] || '—';
  }
  const opts = lang === 'ar' && question.optionsAr?.some(Boolean) ? question.optionsAr : question.options;
  if (question.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE) {
    const labels = (question.correctIndices || []).map((i) => opts?.[i]).filter(Boolean);
    return labels.length ? labels.join(', ') : '—';
  }
  return opts?.[question.correctIndex ?? 0] || '—';
}
