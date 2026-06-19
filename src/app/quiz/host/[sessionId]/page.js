'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  subscribeQuizSession,
  subscribeQuizPlayers,
  hostStartQuestion,
  hostRevealQuestion,
  hostEndQuiz,
} from '../../../../services/quizService';
import { QUIZ_SESSION_STATUS } from '../../../../constants/quiz';
import { SCORA_QUIZ_JOIN_URL } from '../../../../constants/scoraDomains';
import { normalizeQuizSettings } from '../../../../lib/quizSessionHelpers';
import QuizChallengeHeader from '../../../../components/quiz/QuizChallengeHeader';
import QuizLiveStats from '../../../../components/quiz/QuizLiveStats';
import QuizLeaderboardTop6 from '../../../../components/quiz/QuizLeaderboardTop6';
import QuizQuestionDisplay from '../../../../components/quiz/QuizQuestionDisplay';
import QuizJoinQR from '../../../../components/quiz/QuizJoinQR';
import QuizPodium from '../../../../components/quiz/QuizPodium';

export default function QuizHostPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [lang, setLang] = useState('en');
  const [busy, setBusy] = useState(false);
  const autoPlayRef = useRef(false);
  const hostUser = typeof window !== 'undefined'
    ? (() => { try { const raw = localStorage.getItem('adminSession'); if (!raw) return 'host'; return JSON.parse(raw).user?.username || 'host'; } catch { return 'host'; } })()
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
  const settings = normalizeQuizSettings(session?.settings);
  const isReveal = session?.status === QUIZ_SESSION_STATUS.REVEAL;
  const isQuestion = session?.status === QUIZ_SESSION_STATUS.QUESTION;
  const highContrast = settings.highContrast;

  const joinUrl = useMemo(() => {
    if (!session?.pin) return SCORA_QUIZ_JOIN_URL;
    if (typeof window !== 'undefined') return `${window.location.origin}/quiz/join?pin=${session.pin}`;
    return `${SCORA_QUIZ_JOIN_URL}?pin=${session.pin}`;
  }, [session?.pin]);

  const run = useCallback(async (fn) => {
    setBusy(true);
    try { await fn(); } catch (e) { alert(e.message); } finally { setBusy(false); }
  }, []);

  const onTimerExpired = useCallback(() => {
    if (settings.unlimitedTime) return;
    if (session?.status === QUIZ_SESSION_STATUS.QUESTION && !busy) {
      run(() => hostRevealQuestion(sessionId, hostUser));
    }
  }, [session?.status, busy, run, sessionId, hostUser, settings.unlimitedTime]);

  useEffect(() => {
    if (!session || session.status !== QUIZ_SESSION_STATUS.REVEAL || !settings.autoPlay || busy) {
      autoPlayRef.current = false;
      return undefined;
    }
    if (autoPlayRef.current) return undefined;
    autoPlayRef.current = true;
    const id = setTimeout(() => {
      autoPlayRef.current = false;
      if (qIndex + 1 < totalQ) run(() => hostStartQuestion(sessionId, hostUser));
      else run(() => hostEndQuiz(sessionId, hostUser));
    }, (settings.revealDelaySec || 5) * 1000);
    return () => { clearTimeout(id); autoPlayRef.current = false; };
  }, [session?.status, session?.currentQuestionIndex, settings.autoPlay, settings.revealDelaySec, qIndex, totalQ, busy, run, sessionId, hostUser, session]);

  if (!session) return <div className="fixed inset-0 bg-black flex items-center justify-center text-zinc-500">Loading…</div>;

  return (
    <div className={`fixed inset-0 bg-black text-white flex flex-col overflow-hidden ${highContrast ? 'contrast-125' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <QuizChallengeHeader lang={lang} pin={session.pin} division={session.division} subtitle={session.templateTitle} />
        <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white px-3 py-2">{lang === 'en' ? 'العربية' : 'English'}</button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 p-4 md:p-8 overflow-y-auto">
          {session.status === QUIZ_SESSION_STATUS.LOBBY && (
            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-10">
              <div className="text-center space-y-4">
                <p className="text-3xl md:text-5xl font-black uppercase">{lang === 'ar' ? 'قاعة الانتظار' : 'Lobby'}</p>
                <p className="text-zinc-500 text-lg">{players.length} {lang === 'ar' ? 'لاعب متصل' : 'players connected'}</p>
                <button type="button" disabled={busy} onClick={() => run(() => hostStartQuestion(sessionId, hostUser))} className="bg-blue-600 px-12 py-5 rounded-2xl font-black uppercase text-lg disabled:opacity-40">{lang === 'ar' ? 'ابدأ' : 'Start first question'}</button>
              </div>
              <QuizJoinQR url={joinUrl} pin={session.pin} title={lang === 'ar' ? 'امسح للانضمام' : 'Scan to join'} subtitle={lang === 'ar' ? 'أو أدخل الرمز يدوياً' : 'Or enter the PIN manually'} size={180} />
            </div>
          )}

          {(isQuestion || isReveal) && question && (
            <div className="flex-1 flex flex-col min-h-0 gap-6">
              <QuizQuestionDisplay question={question} lang={lang} qIndex={qIndex} totalQ={totalQ} reveal={isReveal} large />
              {isQuestion && (
                <div className="shrink-0 space-y-5">
                  <QuizLiveStats session={session} question={question} onExpired={onTimerExpired} lang={lang} large />
                  {!settings.autoRevealWhenAllAnswered && (
                    <button type="button" disabled={busy} onClick={() => run(() => hostRevealQuestion(sessionId, hostUser))} className="w-full max-w-md mx-auto block bg-amber-600 py-4 rounded-2xl font-black uppercase disabled:opacity-40">{lang === 'ar' ? 'كشف الإجابة' : 'Reveal answer'}</button>
                  )}
                </div>
              )}
              {isReveal && !settings.autoPlay && (
                <div className="shrink-0 flex justify-center gap-3">
                  {qIndex + 1 < totalQ ? (
                    <button type="button" disabled={busy} onClick={() => run(() => hostStartQuestion(sessionId, hostUser))} className="bg-blue-600 px-10 py-4 rounded-2xl font-black uppercase disabled:opacity-40">{lang === 'ar' ? 'التالي' : 'Next question'}</button>
                  ) : (
                    <button type="button" disabled={busy} onClick={() => run(() => hostEndQuiz(sessionId, hostUser))} className="bg-emerald-600 px-10 py-4 rounded-2xl font-black uppercase disabled:opacity-40">{lang === 'ar' ? 'إنهاء' : 'Finish'}</button>
                  )}
                </div>
              )}
            </div>
          )}

          {session.status === QUIZ_SESSION_STATUS.FINISHED && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <QuizPodium players={players} lang={lang} />
              <a href={`/quiz/results/${sessionId}?host=1&lang=${lang}`} className="text-blue-400 font-black uppercase text-sm underline">{lang === 'ar' ? 'النتائج' : 'Full results'}</a>
            </div>
          )}
        </div>

        {(isQuestion || isReveal) && (
          <div className="lg:w-80 shrink-0 p-4 border-t lg:border-l border-white/10 overflow-y-auto">
            <QuizLeaderboardTop6 players={players} prevRanks={session.prevRanks || {}} lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
}
