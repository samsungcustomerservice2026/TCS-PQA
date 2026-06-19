import { QUIZ_BASE_POINTS } from '../constants/quiz';

/**
 * Kahoot-style: faster correct answers earn more points (up to base).
 * @param {number} basePoints
 * @param {number} timeLimitSec
 * @param {number} responseTimeMs
 */
export function computeQuizPoints(basePoints, timeLimitSec, responseTimeMs) {
  if (!Number.isFinite(responseTimeMs) || responseTimeMs < 0) return 0;
  const limitMs = Math.max(1, (timeLimitSec || 20)) * 1000;
  if (responseTimeMs >= limitMs) return Math.round(basePoints * 0.5);
  const ratio = 1 - responseTimeMs / limitMs;
  return Math.round(basePoints * (0.5 + ratio * 0.5));
}

export function defaultQuestionPoints() {
  return QUIZ_BASE_POINTS;
}
