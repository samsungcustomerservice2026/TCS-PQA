/** Live quiz (Kahoot-style) — isolated from TCS/PQA data */

export const QUIZ_DIVISIONS = ['MX', 'DA', 'AV'];

export const QUIZ_QUESTION_TYPES = {
  CHOICE: 'choice',
  TRUE_FALSE: 'true_false',
  TYPE_ANSWER: 'type_answer',
};

export const QUIZ_SESSION_STATUS = {
  LOBBY: 'lobby',
  QUESTION: 'question',
  REVEAL: 'reveal',
  FINISHED: 'finished',
};

export const QUIZ_MAX_PLAYERS = 200;
export const QUIZ_PIN_LENGTH = 6;
export const QUIZ_DEFAULT_TIME_SEC = 20;
export const QUIZ_BASE_POINTS = 1000;

export const QUIZ_COLLECTIONS = {
  templates: 'quiz_templates',
  sessions: 'quiz_live_sessions',
  logs: 'quiz_logs',
};

export const EMPTY_QUIZ_QUESTION = {
  type: QUIZ_QUESTION_TYPES.CHOICE,
  prompt: '',
  promptAr: '',
  options: ['', '', '', ''],
  optionsAr: ['', '', '', ''],
  correctIndex: 0,
  correctIndices: [],
  acceptedAnswers: [],
  acceptedAnswersAr: [],
  timeLimitSec: QUIZ_DEFAULT_TIME_SEC,
  points: QUIZ_BASE_POINTS,
};

export const EMPTY_QUIZ_TEMPLATE = {
  title: '',
  titleAr: '',
  division: 'MX',
  questions: [],
};
