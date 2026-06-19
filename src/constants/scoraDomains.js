/** Canonical Samsung EG SCORA Vercel deployments */
export const SCORA_MAIN_ORIGIN = 'https://samsungeg-scora.vercel.app';
export const SCORA_ADMIN_ORIGIN = 'https://samsungeg-scora-admin.vercel.app';
export const SCORA_TCS_ORIGIN = 'https://samsungeg-scora-tcs.vercel.app';
export const SCORA_PQA_ORIGIN = 'https://samsungeg-scora-pqa.vercel.app';
export const SCORA_QUIZ_ORIGIN = 'https://samsungeg-scora-quiz.vercel.app';

export const SCORA_PUBLIC_PATHS = {
  survey: '/samsung-academy-survey',
  feedback: '/feedback',
  quizJoin: '/quiz/join',
};

/** TCS portal — direct form links (survey & feedback open in TCS context) */
export const SCORA_PUBLIC_SURVEY_URL = `${SCORA_TCS_ORIGIN}${SCORA_PUBLIC_PATHS.survey}`;
export const SCORA_PUBLIC_FEEDBACK_URL = `${SCORA_TCS_ORIGIN}${SCORA_PUBLIC_PATHS.feedback}`;
export const SCORA_QUIZ_JOIN_URL = `${SCORA_QUIZ_ORIGIN}${SCORA_PUBLIC_PATHS.quizJoin}`;

export const SCORA_ADMIN_PORTAL_URL = `${SCORA_ADMIN_ORIGIN}/?portal=admin`;
export const SCORA_ADMIN_QUIZ_URL = `${SCORA_ADMIN_ORIGIN}/?portal=admin&tab=quiz`;
export const SCORA_ADMIN_EXTERNAL_LOGS_URL = `${SCORA_ADMIN_ORIGIN}/?portal=admin&logs=external`;
