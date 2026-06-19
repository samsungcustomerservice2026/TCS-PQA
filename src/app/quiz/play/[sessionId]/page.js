'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  subscribeQuizSession,
  submitQuizAnswer,
} from '../../../../services/quizService';
import { QUIZ_QUESTION_TYPES, QUIZ_SESSION_STATUS } from '../../../../constants/quiz';

const T = {
  en: {
    wait: 'Waiting for host…',
    lobby: 'You are in! Wait for the host to start.',
    answer: 'Submit',
    correct: 'Correct!',
    wrong: 'Wrong',
    done: 'Answer locked in',
    ended: 'Game over — see results',
    typePh: 'Type your answer',
  },
  ar: {
    wait: 'في انتظار المضيف…',
    lobby: 'تم الانضمام! انتظر بدء اللعبة.',
    answer: 'إرسال',
    correct: 'إجابة صحيحة!',
    wrong: 'إجابة خاطئة',
    done: 'تم تسجيل إجابتك',
    ended: 'انتهت اللعبة',
    typePh: 'اكتب إجابتك',
  },
};

function PlayContent() {
  const { sessionId } = useParams();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');
  const lang = searchParams.get('lang') === 'ar' ? 'ar' : 'en';
  const t = T[lang];

  const [session, setSession] = useState(null);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [answeredIndex, setAnsweredIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId) return undefined;
    return subscribeQuizSession(sessionId, setSession);
  }, [sessionId]);

  const qIndex = session?.currentQuestionIndex ?? -1;
  const question = session?.questions?.[qIndex];
  const nickname = typeof window !== 'undefined'
    ? sessionStorage.getItem(`quiz_nick_${sessionId}`) || 'Player'
    : 'Player';

  useEffect(() => {
    if (searchParams.get('playerId')) {
      try {
        const n = searchParams.get('nick');
        if (n) sessionStorage.setItem(`quiz_nick_${sessionId}`, n);
      } catch { /* ignore */ }
    }
  }, [searchParams, sessionId]);

  const pickAnswer = async (value) => {
    if (!playerId || submitting || answeredIndex === qIndex) return;
    if (session?.status !== QUIZ_SESSION_STATUS.QUESTION) return;
    setSubmitting(true);
    try {
      const res = await submitQuizAnswer({
        sessionId,
        playerId,
        nickname,
        answer: value,
      });
      setAnsweredIndex(qIndex);
      setFeedback(res.correct ? t.correct : t.wrong);
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">{t.wait}</div>;
  }

  if (session.status === QUIZ_SESSION_STATUS.FINISHED) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <p className="text-xl font-black text-white uppercase">{t.ended}</p>
        <a href={`/quiz/results/${sessionId}?lang=${lang}`} className="text-blue-400 font-bold underline">
          {lang === 'ar' ? 'عرض النتائج' : 'View results'}
        </a>
      </div>
    );
  }

  if (session.status === QUIZ_SESSION_STATUS.LOBBY || qIndex < 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 p-6 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <p className="text-2xl font-black text-blue-400">{session.pin}</p>
        <p className="text-zinc-400">{t.lobby}</p>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{session.division} · {session.playerCount || 0} players</p>
      </div>
    );
  }

  const prompt = lang === 'ar' && question?.promptAr ? question.promptAr : question?.prompt;
  const options = lang === 'ar' && question?.optionsAr?.some(Boolean)
    ? question.optionsAr
    : question?.options;

  if (session.status === QUIZ_SESSION_STATUS.REVEAL || answeredIndex === qIndex) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <p className="text-lg font-black text-white">{feedback || t.done}</p>
        <p className="text-zinc-500 text-sm">{t.wait}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center mb-4">
        Q{qIndex + 1} · {session.division}
      </p>
      <h2 className="text-xl font-black text-center mb-8 px-2">{prompt}</h2>

      {question?.type === QUIZ_QUESTION_TYPES.TYPE_ANSWER ? (
        <form
          className="mt-auto space-y-4 max-w-md mx-auto w-full"
          onSubmit={(e) => {
            e.preventDefault();
            pickAnswer(typed);
          }}
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-center text-lg outline-none focus:border-blue-500"
            placeholder={t.typePh}
          />
          <button type="submit" disabled={submitting || !typed.trim()} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest disabled:opacity-40">
            {t.answer}
          </button>
        </form>
      ) : question?.type === QUIZ_QUESTION_TYPES.TRUE_FALSE ? (
        <div className="grid grid-cols-2 gap-3 mt-auto max-w-md mx-auto w-full">
          {[
            { v: 'true', label: lang === 'ar' ? 'صح' : 'True', color: 'bg-emerald-600' },
            { v: 'false', label: lang === 'ar' ? 'خطأ' : 'False', color: 'bg-red-600' },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => pickAnswer(opt.v)}
              disabled={submitting}
              className={`${opt.color} py-8 rounded-2xl font-black text-lg uppercase disabled:opacity-40`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 mt-auto max-w-md mx-auto w-full">
          {(options || []).map((opt, i) => {
            const colors = ['bg-red-600', 'bg-blue-600', 'bg-amber-500', 'bg-emerald-600'];
            if (!String(opt || '').trim()) return null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pickAnswer(String(i))}
                disabled={submitting}
                className={`${colors[i % 4]} py-5 px-4 rounded-2xl font-black text-left disabled:opacity-40`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function QuizPlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PlayContent />
    </Suspense>
  );
}
