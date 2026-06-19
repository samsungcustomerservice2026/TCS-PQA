'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  subscribeQuizSession,
  subscribeQuizPlayers,
  hostStartQuestion,
  hostRevealQuestion,
  hostEndQuiz,
} from '../../../../services/quizService';
import { QUIZ_SESSION_STATUS, QUIZ_QUESTION_TYPES } from '../../../../constants/quiz';
import QuizPodium from '../../../../components/quiz/QuizPodium';

export default function QuizHostPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [lang, setLang] = useState('en');
  const [busy, setBusy] = useState(false);
  const hostUser = typeof window !== 'undefined'
    ? (() => {
        try {
          const raw = localStorage.getItem('adminSession');
          if (!raw) return 'host';
          return JSON.parse(raw).user?.username || 'host';
        } catch { return 'host'; }
      })()
    : 'host';

  useEffect(() => {
    if (!sessionId) return undefined;
    const unsub1 = subscribeQuizSession(sessionId, setSession);
    const unsub2 = subscribeQuizPlayers(sessionId, setPlayers);
    return () => { unsub1(); unsub2(); };
  }, [sessionId]);

  const qIndex = session?.currentQuestionIndex ?? -1;
  const question = session?.questions?.[qIndex];
  const totalQ = session?.questions?.length || 0;

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  if (!session) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Loading…</div>;
  }

  const prompt = lang === 'ar' && question?.promptAr ? question.promptAr : question?.prompt;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Quiz Host</p>
            <p className="text-4xl font-black text-blue-400 tracking-widest">{session.pin}</p>
            <p className="text-[10px] text-zinc-500 mt-1">
              {session.division} · {session.playerCount || 0} / 200 · {session.templateTitle}
            </p>
          </div>
          <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white">
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        {session.status === QUIZ_SESSION_STATUS.LOBBY && (
          <div className="text-center space-y-6 py-12">
            <p className="text-2xl font-black uppercase">{lang === 'ar' ? 'قاعة الانتظار' : 'Lobby'}</p>
            <p className="text-zinc-500">{players.length} {lang === 'ar' ? 'لاعب متصل' : 'players connected'}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => hostStartQuestion(sessionId, hostUser))}
              className="bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-2xl font-black uppercase tracking-widest disabled:opacity-40"
            >
              {lang === 'ar' ? 'ابدأ السؤال الأول' : 'Start first question'}
            </button>
          </div>
        )}

        {(session.status === QUIZ_SESSION_STATUS.QUESTION || session.status === QUIZ_SESSION_STATUS.REVEAL) && question && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                {lang === 'ar' ? `سؤال ${qIndex + 1} من ${totalQ}` : `Question ${qIndex + 1} of ${totalQ}`}
              </p>
              <h2 className="text-2xl md:text-4xl font-black">{prompt}</h2>
              <p className="text-zinc-500 text-sm">
                {session.answerCount || 0} / {session.playerCount || 0} {lang === 'ar' ? 'أجابوا' : 'answered'}
              </p>
            </div>

            {session.status === QUIZ_SESSION_STATUS.QUESTION && (
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => hostRevealQuestion(sessionId, hostUser))}
                  className="bg-amber-600 px-8 py-3 rounded-xl font-black uppercase text-sm disabled:opacity-40"
                >
                  {lang === 'ar' ? 'كشف الإجابة' : 'Reveal answer'}
                </button>
              </div>
            )}

            {session.status === QUIZ_SESSION_STATUS.REVEAL && (
              <div className="flex flex-wrap justify-center gap-3">
                {qIndex + 1 < totalQ ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => hostStartQuestion(sessionId, hostUser))}
                    className="bg-blue-600 px-8 py-3 rounded-xl font-black uppercase text-sm disabled:opacity-40"
                  >
                    {lang === 'ar' ? 'السؤال التالي' : 'Next question'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => hostEndQuiz(sessionId, hostUser))}
                    className="bg-emerald-600 px-8 py-3 rounded-xl font-black uppercase text-sm disabled:opacity-40"
                  >
                    {lang === 'ar' ? 'إنهاء وعرض المنصة' : 'Finish & show podium'}
                  </button>
                )}
              </div>
            )}

            <QuizPodium players={players.slice(0, 3)} lang={lang} />
          </div>
        )}

        {session.status === QUIZ_SESSION_STATUS.FINISHED && (
          <div className="space-y-8">
            <QuizPodium players={players} lang={lang} />
            <div className="text-center">
              <a href={`/quiz/results/${sessionId}?lang=${lang}`} className="text-blue-400 font-black uppercase tracking-widest text-sm underline">
                {lang === 'ar' ? 'صفحة النتائج الكاملة' : 'Full results page'}
              </a>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-3">Leaderboard</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {players.slice(0, 10).map((p, i) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-zinc-400">#{i + 1} {p.nickname}</span>
                <span className="font-black text-white">{p.score || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
