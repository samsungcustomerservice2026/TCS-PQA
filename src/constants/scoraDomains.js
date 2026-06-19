/** Canonical Samsung EG SCORA Vercel deployments */

import {
  SCORA_CHALLENGE_ADMIN_TAB,
  SCORA_CHALLENGE_PATHS,
  scoraChallengeJoinUrl,
} from './scoraChallengePaths';

export const SCORA_MAIN_ORIGIN = 'https://samsungeg-scora.vercel.app';
export const SCORA_ADMIN_ORIGIN = 'https://samsungeg-scora-admin.vercel.app';
export const SCORA_TCS_ORIGIN = 'https://samsungeg-scora-tcs.vercel.app';
export const SCORA_PQA_ORIGIN = 'https://samsungeg-scora-pqa.vercel.app';
export const SCORA_QUIZ_ORIGIN = 'https://samsungeg-scora-quiz.vercel.app';

/** Player-facing SCORA Challenge join link (main SCORA domain) */
export const SCORA_CHALLENGE_PLAYER_ORIGIN = SCORA_MAIN_ORIGIN;

export { SCORA_CHALLENGE_ADMIN_TAB, SCORA_CHALLENGE_PATHS, scoraChallengeJoinUrl };

export const SCORA_PUBLIC_PATHS = {
  survey: '/samsung-academy-survey',
  feedback: '/feedback',
  scoraChallengeJoin: SCORA_CHALLENGE_PATHS.join,
};

export const SCORA_PUBLIC_SURVEY_URL = `${SCORA_TCS_ORIGIN}${SCORA_PUBLIC_PATHS.survey}`;
export const SCORA_PUBLIC_FEEDBACK_URL = `${SCORA_TCS_ORIGIN}${SCORA_PUBLIC_PATHS.feedback}`;

export const SCORA_CHALLENGE_JOIN_URL = `${SCORA_MAIN_ORIGIN}${SCORA_CHALLENGE_PATHS.join}`;

/** @deprecated use SCORA_CHALLENGE_JOIN_URL */
export const SCORA_CHALLENGE_JOIN_URL_MAIN = SCORA_CHALLENGE_JOIN_URL;

/** @deprecated use SCORA_CHALLENGE_JOIN_URL */
export const SCORA_QUIZ_JOIN_URL = SCORA_CHALLENGE_JOIN_URL;

export const SCORA_ADMIN_PORTAL_URL = `${SCORA_ADMIN_ORIGIN}/?portal=admin`;
export const SCORA_ADMIN_CHALLENGE_URL = `${SCORA_ADMIN_ORIGIN}/?portal=admin&tab=${SCORA_CHALLENGE_ADMIN_TAB}`;

/** @deprecated use SCORA_ADMIN_CHALLENGE_URL */
export const SCORA_ADMIN_QUIZ_URL = SCORA_ADMIN_CHALLENGE_URL;

export const SCORA_ADMIN_EXTERNAL_LOGS_URL = `${SCORA_ADMIN_ORIGIN}/?portal=admin&logs=external`;

export function getAdminChallengeReportUrl(sessionId) {
  if (!sessionId) return SCORA_ADMIN_CHALLENGE_URL;
  return `${SCORA_ADMIN_ORIGIN}/?portal=admin&tab=${SCORA_CHALLENGE_ADMIN_TAB}&challengeReport=${encodeURIComponent(sessionId)}`;
}

/** @deprecated */
export function getAdminQuizReportUrl(sessionId) {
  return getAdminChallengeReportUrl(sessionId);
}
