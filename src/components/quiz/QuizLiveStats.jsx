'use client';

import React, { useState, useEffect } from 'react';
import { Users, Clock } from 'lucide-react';
import { getQuestionTimeLimit, getTimerRemainingMs, normalizeQuizSettings } from '../../lib/quizSessionHelpers';

function Ring({ pct, color, children, size = 120, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-zinc-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={`transition-all duration-300 ${color}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export default function QuizLiveStats({
  session,
  question,
  onExpired,
  lang = 'en',
  large = false,
}) {
  const [remainingMs, setRemainingMs] = useState(null);
  const settings = normalizeQuizSettings(session?.settings);
  const unlimited = settings.unlimitedTime;
  const answerCount = session?.answerCount || 0;
  const playerCount = session?.playerCount || 0;
  const answerPct = playerCount > 0 ? Math.min(100, (answerCount / playerCount) * 100) : 0;
  const ringSize = large ? 140 : 110;

  useEffect(() => {
    if (!session?.questionStartedAt || !question || unlimited) {
      setRemainingMs(unlimited ? Infinity : null);
      return undefined;
    }
    const tick = () => {
      const ms = getTimerRemainingMs(session, question);
      setRemainingMs(ms);
      if (ms !== null && ms <= 0 && onExpired) onExpired();
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [session?.questionStartedAt, session?.currentQuestionIndex, question, onExpired, unlimited, session]);

  const totalSec = getQuestionTimeLimit(session, question);
  const sec = unlimited ? null : Math.ceil((remainingMs ?? 0) / 1000);
  const timePct = unlimited ? 100 : Math.max(0, Math.min(100, ((remainingMs ?? 0) / (totalSec * 1000)) * 100));
  const urgent = !unlimited && sec !== null && sec <= 5;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-6 md:gap-10 ${large ? 'py-4' : ''}`}>
      <div className="flex flex-col items-center gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'الوقت' : 'Time left'}
        </p>
        <Ring
          pct={timePct}
          color={urgent ? 'text-red-500' : 'text-blue-500'}
          size={ringSize}
        >
          {unlimited ? (
            <span className="text-2xl font-black text-zinc-400">∞</span>
          ) : (
            <>
              <span className={`text-3xl md:text-4xl font-black tabular-nums leading-none ${urgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {sec ?? '—'}
              </span>
              <span className="text-[9px] font-black uppercase text-zinc-500 mt-0.5">sec</span>
            </>
          )}
        </Ring>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'الإجابات' : 'Answers in'}
        </p>
        <Ring
          pct={answerPct}
          color={answerPct >= 100 ? 'text-emerald-500' : 'text-orange-500'}
          size={ringSize}
        >
          <span className="text-2xl md:text-3xl font-black text-white tabular-nums leading-none">
            {answerCount}
            <span className="text-zinc-500 text-lg">/{playerCount}</span>
          </span>
        </Ring>
        <p className="text-[10px] text-zinc-600 font-bold">
          {answerPct >= 100
            ? (lang === 'ar' ? 'الجميع أجاب' : 'Everyone answered')
            : `${Math.round(answerPct)}%`}
        </p>
      </div>
    </div>
  );
}
