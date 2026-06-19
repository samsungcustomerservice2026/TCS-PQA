import { QUIZ_QUESTION_TYPES } from '../constants/quiz';

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseIndexList(rawAnswer) {
  return String(rawAnswer || '')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
}

export function checkQuizAnswer(question, rawAnswer) {
  if (!question) return false;
  const type = question.type;

  if (type === QUIZ_QUESTION_TYPES.POLL) return true;

  if (type === QUIZ_QUESTION_TYPES.CHOICE) {
    const idx = parseInt(rawAnswer, 10);
    return Number.isFinite(idx) && idx === (question.correctIndex ?? 0);
  }

  if (type === QUIZ_QUESTION_TYPES.MULTI_CHOICE) {
    const picked = parseIndexList(rawAnswer);
    const expected = [...(question.correctIndices || [])].sort((a, b) => a - b);
    return picked.length === expected.length && picked.every((v, i) => v === expected[i]);
  }

  if (type === QUIZ_QUESTION_TYPES.TRUE_FALSE) {
    const expected = (question.correctIndex ?? 0) === 0 ? 'true' : 'false';
    return normalizeText(rawAnswer) === expected;
  }

  if (type === QUIZ_QUESTION_TYPES.TYPE_ANSWER) {
    const given = normalizeText(rawAnswer);
    const accepted = [...(question.acceptedAnswers || []), ...(question.acceptedAnswersAr || [])]
      .map(normalizeText).filter(Boolean);
    return accepted.some((a) => a === given);
  }

  return false;
}

export function isScoredQuestionType(type) {
  return type !== QUIZ_QUESTION_TYPES.POLL;
}
