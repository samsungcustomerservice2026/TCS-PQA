'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  subscribeQuizSession,
  subscribeQuizPlayers,
  getQuizSessionAnswers,
} from '../../../../services/quizService';
import QuizPodium from '../../../../components/quiz/QuizPodium';
import QuizJoinAnotherGame from '../../../../components/quiz/QuizJoinAnotherGame';

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
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
            {lang === 'ar' ? 'النتائج النهائية' : 'Final results'}
          </p>
          <h1 className="text-2xl font-black">{session.templateTitle}</h1>
          <p className="text-zinc-500 text-sm">{session.division} · PIN {session.pin} · {players.length} players</p>
        </div>

        <QuizPodium players={players} lang={lang} />

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {lang === 'ar' ? ' الترتيب الكامل' : 'Full ranking'}
          </p>
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-zinc-950 p-4">
              <span className="font-black text-zinc-400 w-8">#{i + 1}</span>
              <span className="flex-1 font-bold">{p.nickname}</span>
              <span className="font-black text-blue-400">{p.score || 0}</span>
            </div>
          ))}
        </div>

        {answers.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {lang === 'ar' ? 'سجل الإجابات' : 'Answer log'}
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
              {answers.slice(0, 100).map((a) => (
                <div key={a.id} className="flex flex-wrap gap-2 text-zinc-500 border-b border-white/5 pb-2">
                  <span className="text-white font-bold">{a.nickname}</span>
                  <span>Q{(a.questionIndex ?? 0) + 1}</span>
                  <span className={a.correct ? 'text-emerald-400' : 'text-red-400'}>
                    {a.correct ? '✓' : '✗'} {a.answer}
                  </span>
                  <span>+{a.points || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
