'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { QUIZ_QUESTION_TYPES } from '../../constants/quiz';

export default function QuizAnswerFeedback({
  correct,
  isPoll = false,
  lang = 'en',
  size = 'large',
  className = '',
}) {
  if (correct === null || correct === undefined) return null;
  if (isPoll) return null;

  const labels = lang === 'ar'
    ? { correct: 'إجابة صحيحة!', wrong: 'إجابة خاطئة' }
    : { correct: 'Correct!', wrong: 'Wrong' };

  const isLarge = size === 'large';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-2 rounded-2xl border px-6 py-4 ${
        correct
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          : 'border-red-500/40 bg-red-500/10 text-red-400'
      } ${isLarge ? 'py-8 px-8' : ''} ${className}`}
    >
      {correct ? (
        <CheckCircle2 className={isLarge ? 'w-16 h-16' : 'w-10 h-10'} />
      ) : (
        <XCircle className={isLarge ? 'w-16 h-16' : 'w-10 h-10'} />
      )}
      <p className={`font-black uppercase tracking-wide ${isLarge ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
        {correct ? labels.correct : labels.wrong}
      </p>
    </div>
  );
}

export function useAnswerResultStorage(sessionId, qIndex) {
  const key = sessionId != null && qIndex >= 0 ? `quiz_result_${sessionId}_q${qIndex}` : null;

  const save = (correct, isPoll) => {
    if (!key || typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, JSON.stringify({ correct, isPoll }));
    } catch { /* ignore */ }
  };

  const load = () => {
    if (!key || typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  return { save, load };
}

export function isScoredFeedbackType(type) {
  return type !== QUIZ_QUESTION_TYPES.POLL;
}
