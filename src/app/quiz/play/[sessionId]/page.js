'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { subscribeQuizSession, submitQuizAnswer } from '../../../../services/quizService';
import { QUIZ_QUESTION_TYPES, QUIZ_SESSION_STATUS } from '../../../../constants/quiz';
import QuizChallengeHeader from '../../../../components/quiz/QuizChallengeHeader';
import QuizLiveStats from '../../../../components/quiz/QuizLiveStats';
import QuizQuestionDisplay from '../../../../components/quiz/QuizQuestionDisplay';
import QuizJoinAnotherGame from '../../../../components/quiz/QuizJoinAnotherGame';
import QuizAnswerFeedback, { useAnswerResultStorage, isScoredFeedbackType } from '../../../../components/quiz/QuizAnswerFeedback';
import QuizRevealCountdown from '../../../../components/quiz/QuizRevealCountdown';
import { normalizeQuizSettings } from '../../../../lib/quizSessionHelpers';

const T = {
  en: { wait: 'Waiting…', lobby: 'You are in! Wait for the host.', correct: 'Correct!', wrong: 'Wrong', done: 'Answer locked in', waitingReveal: 'Waiting for others…', pollDone: 'Vote recorded!' },
  ar: { wait: 'في الانتظار…', lobby: 'تم الانضمام!', correct: 'صحيح!', wrong: 'خطأ', done: 'تم التسجيل', waitingReveal: 'في انتظار الآخرين…', pollDone: 'تم التصويت!' },
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
  const [multiSelected, setMultiSelected] = useState([]);
  const [answerCorrect, setAnswerCorrect] = useState(null);

  useEffect(() => {
    if (!sessionId) return undefined;
    return subscribeQuizSession(sessionId, setSession);
  }, [sessionId]);

  const qIndex = session?.currentQuestionIndex ?? -1;
  const question = session?.questions?.[qIndex];
  const nickname = typeof window !== 'undefined' ? sessionStorage.getItem(`quiz_nick_${sessionId}`) || 'Player' : 'Player';
  const resultStorage = useAnswerResultStorage(sessionId, qIndex);

  useEffect(() => {
    if (qIndex !== answeredIndex) {
      setTyped('');
      setFeedback(null);
      setMultiSelected([]);
      setAnswerCorrect(null);
    }
  }, [qIndex, answeredIndex]);

  useEffect(() => {
    if (qIndex < 0 || answeredIndex !== qIndex || !sessionId) return;
    try {
      const raw = sessionStorage.getItem(`quiz_result_${sessionId}_q${qIndex}`);
      if (!raw) return;
      const stored = JSON.parse(raw);
      setAnswerCorrect(stored.correct);
    } catch { /* ignore */ }
  }, [qIndex, answeredIndex, sessionId]);

  const pickAnswer = async (value) => {
    if (!playerId || submitting || answeredIndex === qIndex || session?.status !== QUIZ_SESSION_STATUS.QUESTION) return;
    setSubmitting(true);
    try {
      const res = await submitQuizAnswer({ sessionId, playerId, nickname, answer: value });
      setAnsweredIndex(qIndex);
      const isPoll = question?.type === QUIZ_QUESTION_TYPES.POLL;
      setAnswerCorrect(isPoll ? null : res.correct);
      resultStorage.save(res.correct, isPoll);
      setFeedback(isPoll ? t.pollDone : (res.correct ? t.correct : t.wrong));
    } catch (e) { setFeedback(e.message); } finally { setSubmitting(false); }
  };

  if (!session) return <div className="fixed inset-0 bg-black flex items-center justify-center text-zinc-500">{t.wait}</div>;
  if (session.status === QUIZ_SESSION_STATUS.FINISHED) {
    return <QuizJoinAnotherGame lang={lang} />;
  }
  if (session.status === QUIZ_SESSION_STATUS.LOBBY || qIndex < 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <QuizChallengeHeader lang={lang} pin={session.pin} division={session.division} />
        <p className="text-zinc-400">{t.lobby}</p>
      </div>
    );
  }

  const hasAnswered = answeredIndex === qIndex;
  const isReveal = session.status === QUIZ_SESSION_STATUS.REVEAL;
  const disabled = submitting || hasAnswered || isReveal;
  const settings = normalizeQuizSettings(session.settings);
  const hidePrompt = !settings.showQuestionsOnDevices;
  const highContrast = settings.highContrast;

  const toggleMulti = (idx) => {
    if (disabled) return;
    setMultiSelected((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b));
  };

  return (
    <div className={`fixed inset-0 bg-black text-white flex flex-col overflow-hidden ${highContrast ? 'contrast-125' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="shrink-0 px-4 py-3 border-b border-white/10">
        <QuizChallengeHeader lang={lang} pin={session.pin} division={session.division} />
      </div>
      <div className="flex-1 flex flex-col min-h-0 p-4 overflow-y-auto">
        {!isReveal && !hasAnswered && <div className="shrink-0 mb-4"><QuizLiveStats session={session} question={question} lang={lang} large /></div>}
        {isReveal && (
          <div className="shrink-0 mb-6 space-y-4">
            <QuizRevealCountdown session={session} lang={lang} />
            {isScoredFeedbackType(question?.type) && answerCorrect !== null && (
              <QuizAnswerFeedback correct={answerCorrect} lang={lang} size="large" />
            )}
          </div>
        )}
        {hasAnswered && !isReveal ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            {isScoredFeedbackType(question?.type) && answerCorrect !== null ? (
              <QuizAnswerFeedback correct={answerCorrect} lang={lang} size="large" />
            ) : (
              <p className="text-emerald-400 font-black text-xl">{feedback || t.done}</p>
            )}
            <div>
              <p className="text-zinc-500">{t.waitingReveal}</p>
              <p className="text-sm text-zinc-600 mt-1">{session.answerCount || 0} / {session.playerCount || 0}</p>
            </div>
          </div>
        ) : (
          <QuizQuestionDisplay
            question={question} lang={lang} qIndex={qIndex} totalQ={session.questions?.length || 0}
            reveal={isReveal} large disabled={disabled} typedValue={typed} onTypedChange={setTyped}
            onSubmitTyped={() => (question?.type === QUIZ_QUESTION_TYPES.MULTI_CHOICE ? pickAnswer(multiSelected.join(',')) : pickAnswer(typed))}
            onPick={pickAnswer} multiSelected={multiSelected} onToggleMulti={toggleMulti}
            hidePrompt={hidePrompt}
          />
        )}
      </div>
    </div>
  );
}

export default function QuizPlayPage() {
  return <Suspense fallback={<div className="fixed inset-0 bg-black" />}><PlayContent /></Suspense>;
}
