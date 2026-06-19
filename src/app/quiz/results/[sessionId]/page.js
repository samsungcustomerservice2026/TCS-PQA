'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  subscribeQuizSession,
  subscribeQuizPlayers,
  getQuizSessionAnswers,
} from '../../../../services/quizService';
import QuizJoinAnotherGame from '../../../../components/quiz/QuizJoinAnotherGame';
import QuizResultsSummary from '../../../../components/quiz/QuizResultsSummary';
import QuizChallengeHeader from '../../../../components/quiz/QuizChallengeHeader';

function ResultsContent() {
  const { sessionId } = useParams();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') === 'ar' ? 'ar' : 'en';
  const isHostView = searchParams.get('host') === '1';
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    if (!sessionId) return undefined;
    const unsub1 = subscribeQuizSession(sessionId, setSession);
    const unsub2 = subscribeQuizPlayers(sessionId, setPlayers);
    getQuizSessionAnswers(sessionId).then(setAnswers);
    return () => { unsub1(); unsub2(); };
  }, [sessionId]);

  if (!session) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Loading…</div>;
  }

  if (!isHostView) {
    return <QuizJoinAnotherGame lang={lang} />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <QuizChallengeHeader lang={lang} pin={session.pin} division={session.division} subtitle={session.templateTitle} />
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
            {lang === 'ar' ? 'النتائج النهائية' : 'Final results'}
          </p>
          <p className="text-zinc-500 text-sm">{players.length} {lang === 'ar' ? 'لاعب' : 'players'}</p>
        </div>

        <QuizResultsSummary
          session={session}
          players={players}
          answers={answers}
          lang={lang}
          showPortalLink
        />
      </div>
    </div>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ResultsContent />
    </Suspense>
  );
}
