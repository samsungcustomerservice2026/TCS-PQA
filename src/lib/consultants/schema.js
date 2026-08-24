import {
  CONSULTANT_AUDIENCE,
  CONSULTANT_STATUS,
  DEFAULT_MIN_DWELL_SECONDS,
  DEFAULT_MAX_CHOICE_ATTEMPTS,
  DEFAULT_QUESTION_TIME_LIMIT_SEC,
  EMPLOYEE_STATUS,
  EMPLOYEE_PRODUCT_LINE,
  PROGRESS_RESULT,
  TIP_QUESTION_TYPE,
} from './constants';

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function createEmptyTipQuestion({
  type = TIP_QUESTION_TYPE.CHOICE,
  prompt_en = '',
  prompt_ar = '',
  timeLimitSec = DEFAULT_QUESTION_TIME_LIMIT_SEC,
} = {}) {
  const t = type === TIP_QUESTION_TYPE.TEXT ? TIP_QUESTION_TYPE.TEXT : TIP_QUESTION_TYPE.CHOICE;
  return {
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    type: t,
    prompt_en: String(prompt_en || '').trim(),
    prompt_ar: String(prompt_ar || '').trim(),
    options_en: t === TIP_QUESTION_TYPE.CHOICE ? ['', '', '', ''] : [],
    options_ar: t === TIP_QUESTION_TYPE.CHOICE ? ['', '', '', ''] : [],
    correctIndex: 0,
    timeLimitSec: Math.max(0, Math.floor(Number(timeLimitSec) || 0)),
    maxChoiceAttempts: DEFAULT_MAX_CHOICE_ATTEMPTS,
  };
}

export function normalizeTipQuestions(questions = []) {
  if (!Array.isArray(questions)) return [];
  return questions
    .map((q, i) => {
      if (!q || typeof q !== 'object') return null;
      const type =
        q.type === TIP_QUESTION_TYPE.TEXT ? TIP_QUESTION_TYPE.TEXT : TIP_QUESTION_TYPE.CHOICE;
      const options_en = (Array.isArray(q.options_en) ? q.options_en : [])
        .map((o) => String(o || '').trim())
        .slice(0, 6);
      const options_ar = (Array.isArray(q.options_ar) ? q.options_ar : [])
        .map((o) => String(o || '').trim())
        .slice(0, 6);
      while (type === TIP_QUESTION_TYPE.CHOICE && options_en.length < 2) options_en.push('');
      const filledEn = options_en.filter(Boolean);
      const correctIndex = Math.max(
        0,
        Math.min(
          Math.floor(Number(q.correctIndex) || 0),
          Math.max(0, (type === TIP_QUESTION_TYPE.CHOICE ? options_en.length : 1) - 1),
        ),
      );
      return {
        id: String(q.id || `q_${i}_${Date.now().toString(36)}`).trim(),
        type,
        prompt_en: String(q.prompt_en || '').trim(),
        prompt_ar: String(q.prompt_ar || '').trim(),
        options_en: type === TIP_QUESTION_TYPE.CHOICE ? options_en : [],
        options_ar: type === TIP_QUESTION_TYPE.CHOICE ? options_ar : [],
        correctIndex: type === TIP_QUESTION_TYPE.CHOICE ? correctIndex : 0,
        timeLimitSec: Math.max(0, Math.floor(Number(q.timeLimitSec) || 0)),
        maxChoiceAttempts: Math.max(
          1,
          Math.min(10, Math.floor(Number(q.maxChoiceAttempts) || DEFAULT_MAX_CHOICE_ATTEMPTS)),
        ),
        _filledOptionCount: filledEn.length,
      };
    })
    .filter(Boolean)
    .map(({ _filledOptionCount, ...q }) => q);
}

export function consultantHasQuiz(consultant) {
  return !!(
    consultant?.quizEnabled &&
    Array.isArray(consultant?.questions) &&
    consultant.questions.length > 0
  );
}

/**
 * Evaluate submitted quiz answers against consultant questions.
 * Choice: selectedIndex must match correctIndex (tries tracked by caller).
 * Text: any non-empty textAnswer counts as submitted/pass for that Q.
 */
export function evaluateTipQuiz(consultant, quizAnswers = []) {
  const questions = normalizeTipQuestions(consultant?.questions || []);
  if (!consultantHasQuiz({ ...consultant, questions }) || !questions.length) {
    return {
      quizRequired: false,
      quizPassed: true,
      quizAnswers: [],
      quizScore: { correct: 0, totalChoice: 0, textSubmitted: 0 },
    };
  }

  const byId = {};
  for (const a of Array.isArray(quizAnswers) ? quizAnswers : []) {
    if (a?.questionId) byId[a.questionId] = a;
  }

  let correct = 0;
  let totalChoice = 0;
  let textSubmitted = 0;
  const normalized = [];
  let quizPassed = true;

  for (const q of questions) {
    const ans = byId[q.id] || {};
    const timedOut = !!ans.timedOut;
    const timeSpentSec = Math.max(0, Math.floor(Number(ans.timeSpentSec) || 0));
    const choiceTries = Math.max(0, Math.floor(Number(ans.choiceTries) || 0));

    if (q.type === TIP_QUESTION_TYPE.CHOICE) {
      totalChoice += 1;
      const selectedIndex =
        ans.selectedIndex == null || ans.selectedIndex === ''
          ? null
          : Math.floor(Number(ans.selectedIndex));
      const isCorrect =
        !timedOut && selectedIndex != null && selectedIndex === Number(q.correctIndex);
      if (isCorrect) correct += 1;
      else quizPassed = false;
      normalized.push({
        questionId: q.id,
        type: q.type,
        prompt_en: q.prompt_en,
        prompt_ar: q.prompt_ar,
        selectedIndex,
        textAnswer: '',
        correct: isCorrect,
        timedOut,
        choiceTries,
        timeSpentSec,
        correctIndex: q.correctIndex,
        options_en: q.options_en,
      });
    } else {
      const textAnswer = String(ans.textAnswer || '').trim();
      const ok = !timedOut && textAnswer.length > 0;
      if (ok) textSubmitted += 1;
      else quizPassed = false;
      normalized.push({
        questionId: q.id,
        type: q.type,
        prompt_en: q.prompt_en,
        prompt_ar: q.prompt_ar,
        selectedIndex: null,
        textAnswer,
        correct: ok,
        timedOut,
        choiceTries: 0,
        timeSpentSec,
        correctIndex: null,
        options_en: [],
      });
    }
  }

  return {
    quizRequired: true,
    quizPassed,
    quizAnswers: normalized,
    quizScore: { correct, totalChoice, textSubmitted },
  };
}

export function createEmptyConsultant({
  title_en = '',
  title_ar = '',
  summary_en = '',
  summary_ar = '',
  category = 'general',
  tags = [],
  minDwellSeconds = DEFAULT_MIN_DWELL_SECONDS,
  audience = CONSULTANT_AUDIENCE.ALL,
  mustComplete = true,
  quizEnabled = false,
  questions = [],
  actor = 'admin',
} = {}) {
  const now = new Date().toISOString();
  const base = slugify(title_en) || `consultant-${Date.now()}`;
  const normalizedQs = normalizeTipQuestions(questions);
  return {
    id: `${base}-${Date.now().toString(36)}`,
    title_en: String(title_en || '').trim(),
    title_ar: String(title_ar || title_en || '').trim(),
    summary_en: String(summary_en || '').trim(),
    summary_ar: String(summary_ar || summary_en || '').trim(),
    category: String(category || 'general').trim() || 'general',
    tags: (Array.isArray(tags) ? tags : String(tags || '').split(/[,;]/))
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 20),
    minDwellSeconds: Math.max(30, Number(minDwellSeconds) || DEFAULT_MIN_DWELL_SECONDS),
    audience: Object.values(CONSULTANT_AUDIENCE).includes(audience)
      ? audience
      : CONSULTANT_AUDIENCE.ALL,
    mustComplete: mustComplete !== false,
    quizEnabled: !!quizEnabled && normalizedQs.length > 0,
    questions: normalizedQs,
    status: CONSULTANT_STATUS.DRAFT,
    assets: [],
    searchText: '',
    extractStatus: 'pending',
    publishedAt: null,
    announcementId: null,
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
    updatedBy: actor,
  };
}

export function validateConsultant(record) {
  const errors = [];
  if (!record?.title_en?.trim()) errors.push('title_en is required');
  if (!record?.minDwellSeconds || Number(record.minDwellSeconds) < 30) {
    errors.push('minDwellSeconds must be at least 30');
  }
  if (!Object.values(CONSULTANT_STATUS).includes(record?.status)) {
    errors.push('invalid status');
  }
  if (record?.quizEnabled) {
    const qs = normalizeTipQuestions(record.questions || []);
    if (!qs.length) errors.push('quizEnabled requires at least one question');
    qs.forEach((q, i) => {
      if (!q.prompt_en?.trim()) errors.push(`question ${i + 1}: prompt_en is required`);
      if (q.type === TIP_QUESTION_TYPE.CHOICE) {
        const filled = (q.options_en || []).filter((o) => String(o || '').trim());
        if (filled.length < 2) errors.push(`question ${i + 1}: need at least 2 EN options`);
        if (q.correctIndex < 0 || q.correctIndex >= (q.options_en || []).length) {
          errors.push(`question ${i + 1}: invalid correctIndex`);
        } else if (!String(q.options_en[q.correctIndex] || '').trim()) {
          errors.push(`question ${i + 1}: correct option is empty`);
        }
      }
      if (q.timeLimitSec < 0) errors.push(`question ${i + 1}: invalid timeLimitSec`);
    });
  }
  return { ok: errors.length === 0, errors };
}

export function createAnnouncementFromConsultant(consultant, actor = 'admin') {
  const now = new Date().toISOString();
  return {
    id: `ann-${consultant.id}`,
    consultantId: consultant.id,
    title_en: consultant.title_en,
    title_ar: consultant.title_ar || consultant.title_en,
    body_en: consultant.summary_en || `New technical consultant: ${consultant.title_en}`,
    body_ar: consultant.summary_ar || consultant.summary_en || `استشارة فنية جديدة: ${consultant.title_ar || consultant.title_en}`,
    audience: consultant.audience || CONSULTANT_AUDIENCE.ALL,
    active: true,
    mustComplete: consultant.mustComplete !== false,
    createdAt: now,
    createdBy: actor,
  };
}

export function createEmptyEmployeeProfile({
  uid,
  email,
  gspnId,
  phone = '',
  displayName = '',
  productLine = EMPLOYEE_PRODUCT_LINE.MX,
} = {}) {
  const now = new Date().toISOString();
  const line = Object.values(EMPLOYEE_PRODUCT_LINE).includes(productLine)
    ? productLine
    : EMPLOYEE_PRODUCT_LINE.MX;
  return {
    uid,
    email: String(email || '').trim().toLowerCase(),
    gspnId: String(gspnId || '').trim().toUpperCase(),
    phone: String(phone || '').trim(),
    displayName: String(displayName || '').trim(),
    productLine: line,
    status: EMPLOYEE_STATUS.ACTIVE,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
}

export function createEmptyProgress({ uid, consultantId, consultantTitle = '' } = {}) {
  const now = new Date().toISOString();
  return {
    id: `${uid}_${consultantId}`,
    uid,
    consultantId,
    consultantTitle,
    lastResult: null,
    bestResult: null,
    currentAttempt: null,
    attempts: [],
    totalDwellSeconds: 0,
    totalClicks: 0,
    updatedAt: now,
    createdAt: now,
  };
}

export function startAttempt(progress, { minDwellSeconds } = {}) {
  const now = new Date().toISOString();
  const attempt = {
    attemptNo: (progress.attempts?.length || 0) + 1,
    startedAt: now,
    endedAt: null,
    dwellSeconds: 0,
    clickCount: 0,
    result: PROGRESS_RESULT.IN_PROGRESS,
    minDwellSeconds: Number(minDwellSeconds) || DEFAULT_MIN_DWELL_SECONDS,
  };
  return {
    ...progress,
    currentAttempt: attempt,
    lastResult: PROGRESS_RESULT.IN_PROGRESS,
    updatedAt: now,
  };
}

export function finalizeAttempt(
  progress,
  {
    dwellSeconds,
    clickCount,
    result,
    quizAnswers = null,
    quizScore = null,
    quizPassed = null,
  } = {},
) {
  const now = new Date().toISOString();
  const current = progress.currentAttempt || {
    attemptNo: (progress.attempts?.length || 0) + 1,
    startedAt: now,
    minDwellSeconds: DEFAULT_MIN_DWELL_SECONDS,
  };
  const finished = {
    ...current,
    endedAt: now,
    dwellSeconds: Math.max(0, Math.floor(Number(dwellSeconds) || 0)),
    clickCount: Math.max(0, Math.floor(Number(clickCount) || 0)),
    result,
  };
  if (quizAnswers != null) finished.quizAnswers = quizAnswers;
  if (quizScore != null) finished.quizScore = quizScore;
  if (quizPassed != null) finished.quizPassed = !!quizPassed;

  const attempts = [...(progress.attempts || []), finished];
  const bestResult =
    attempts.some((a) => a.result === PROGRESS_RESULT.PASSED)
      ? PROGRESS_RESULT.PASSED
      : result;
  return {
    ...progress,
    attempts,
    currentAttempt: null,
    lastResult: result,
    bestResult,
    lastQuizScore: quizScore != null ? quizScore : progress.lastQuizScore || null,
    lastQuizPassed: quizPassed != null ? !!quizPassed : progress.lastQuizPassed || null,
    totalDwellSeconds: (progress.totalDwellSeconds || 0) + finished.dwellSeconds,
    totalClicks: (progress.totalClicks || 0) + finished.clickCount,
    updatedAt: now,
  };
}

export function formatQuizSummary(quizScore, quizPassed) {
  if (!quizScore) return '';
  const parts = [];
  if (quizScore.totalChoice > 0) {
    parts.push(`${quizScore.correct || 0}/${quizScore.totalChoice} choice`);
  }
  if (quizScore.textSubmitted > 0 || (quizScore.totalChoice === 0 && quizPassed != null)) {
    parts.push(`${quizScore.textSubmitted || 0} text`);
  }
  const base = parts.join(', ') || '—';
  if (quizPassed == null) return base;
  return `${base}${quizPassed ? ' · passed' : ' · failed'}`;
}

export function progressDocId(uid, consultantId) {
  return `${uid}_${consultantId}`;
}
