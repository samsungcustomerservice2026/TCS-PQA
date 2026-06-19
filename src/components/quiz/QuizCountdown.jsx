'use client';

import React, { useState, useEffect } from 'react';
import { getQuestionTimeLimit, getTimerRemainingMs } from '../../lib/quizSessionHelpers';

export default function QuizCountdown({ session, question, onExpired, large = false }) {
  const [remainingMs, setRemainingMs] = useState(null);

  useEffect(() => {
    if (!session?.questionStartedAt || !question) {
      setRemainingMs(null);
      return undefined;
    }
    const tick = () => {
      const ms = getTimerRemainingMs(session, question);
      setRemainingMs(ms);
      if (ms !== null && ms <= 0 && onExpired) onExpired();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [session?.questionStartedAt, session?.currentQuestionIndex, question, onExpired]);

  if (remainingMs == null) return null;

  const totalSec = getQuestionTimeLimit(session, question);
  const sec = Math.ceil(remainingMs / 1000);
  const pct = Math.max(0, Math.min(100, (remainingMs / (totalSec * 1000)) * 100));
  const urgent = sec <= 5;

  return (
    <div className={`w-full max-w-md mx-auto space-y-2 ${large ? 'scale-110' : ''}`}>
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
        <span>Timer</span>
        <span className={urgent ? 'text-red-400 animate-pulse' : 'text-white'}>{sec}s</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-900 overflow-hidden border border-white/10">
        <div className={`h-full transition-all duration-300 ${urgent ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
