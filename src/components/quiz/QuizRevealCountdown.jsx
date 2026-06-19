'use client';

import React, { useState, useEffect } from 'react';
import { normalizeQuizSettings } from '../../lib/quizSessionHelpers';

export default function QuizRevealCountdown({
  session,
  lang = 'en',
  className = '',
}) {
  const settings = normalizeQuizSettings(session?.settings);
  const delaySec = settings.revealDelaySec || 5;
  const autoPlay = settings.autoPlay;
  const revealStartedAt = session?.revealStartedAt;
  const [remaining, setRemaining] = useState(delaySec);

  useEffect(() => {
    if (!autoPlay) {
      setRemaining(delaySec);
      return undefined;
    }
    const tick = () => {
      const base = revealStartedAt ? new Date(revealStartedAt).getTime() : Date.now();
      const elapsed = Date.now() - base;
      const left = Math.max(0, Math.ceil(delaySec - elapsed / 1000));
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [autoPlay, revealStartedAt, delaySec]);

  if (!autoPlay) return null;

  const isLastQuestion = (session?.currentQuestionIndex ?? 0) + 1 >= (session?.questions?.length || 0);
  const label = isLastQuestion
    ? (lang === 'ar' ? 'النتائج خلال' : 'Results in')
    : (lang === 'ar' ? 'سؤال جديد خلال' : 'New question in');

  return (
    <div className={`text-center space-y-2 ${className}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{label}</p>
      <p className="text-5xl md:text-6xl font-black tabular-nums text-orange-400 animate-pulse">
        {remaining}
        <span className="text-lg md:text-xl text-zinc-500 ml-2">{lang === 'ar' ? 'ث' : 'sec'}</span>
      </p>
    </div>
  );
}
