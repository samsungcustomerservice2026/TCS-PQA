'use client';

import React, { useState, useEffect } from 'react';

const RANK_STYLES = {
  1: 'border-yellow-500/50 text-yellow-400 shadow-lg shadow-yellow-500/20',
  2: 'border-zinc-300/40 text-zinc-200 shadow-lg shadow-zinc-400/10',
  3: 'border-orange-600/40 text-orange-400 shadow-lg shadow-orange-500/10',
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const REVEAL_MS = {
  third: 900,
  second: 3400,
  first: 5900,
  runners: 20900,
  full: 22600,
};

function PodiumSlot({ player, rank, tall, visible }) {
  if (!player) {
    return <div className="flex-1 min-w-0" aria-hidden />;
  }

  const style = RANK_STYLES[rank] || 'border-white/10 text-white';
  const barHeight = tall ? 'h-24 md:h-32' : rank === 2 ? 'h-16 md:h-20' : 'h-12 md:h-16';
  const orderClass = tall ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';

  return (
    <div
      className={`flex flex-1 min-w-0 flex-col items-center gap-3 ${orderClass}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.92)',
        transition: `opacity 1.1s ${EASE}, transform 1.1s ${EASE}`,
      }}
    >
      <div
        className={`w-14 h-14 md:w-[4.5rem] md:h-[4.5rem] rounded-2xl border-2 flex items-center justify-center text-xl font-black ${style}`}
        style={{
          transform: visible ? 'scale(1)' : 'scale(0)',
          transition: `transform 0.9s ${EASE} 0.15s`,
        }}
      >
        #{rank}
      </div>
      <p
        className="text-xs md:text-sm font-black uppercase tracking-wide text-white text-center line-clamp-2 max-w-[9rem]"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity 0.8s ease 0.35s`,
        }}
      >
        {player.nickname}
      </p>
      <p
        className="text-[10px] font-bold text-zinc-500 tabular-nums"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity 0.8s ease 0.45s`,
        }}
      >
        {player.score || 0}
      </p>
      <div className="w-full flex items-end justify-center" style={{ height: tall ? '8rem' : rank === 2 ? '5.5rem' : '4rem' }}>
        <div
          className={`w-full rounded-t-xl bg-gradient-to-b from-zinc-600/90 to-zinc-950 border border-white/10 ${barHeight}`}
          style={{
            transform: visible ? 'scaleY(1)' : 'scaleY(0)',
            transformOrigin: 'bottom',
            transition: `transform 1.2s ${EASE} 0.2s`,
          }}
        />
      </div>
    </div>
  );
}

export default function QuizPodium({
  players = [],
  lang = 'en',
  animateReveal = false,
  onRevealPhaseChange,
}) {
  const top = players.slice(0, 3);
  const [phase, setPhase] = useState(animateReveal ? 0 : 4);

  useEffect(() => {
    if (!animateReveal) {
      setPhase(4);
      return undefined;
    }
    setPhase(0);
    const timers = [
      setTimeout(() => setPhase(1), REVEAL_MS.third),
      setTimeout(() => setPhase(2), REVEAL_MS.second),
      setTimeout(() => setPhase(3), REVEAL_MS.first),
      setTimeout(() => setPhase(4), REVEAL_MS.runners),
      setTimeout(() => setPhase(5), REVEAL_MS.full),
    ];
    return () => timers.forEach(clearTimeout);
  }, [animateReveal, players.length]);

  useEffect(() => {
    onRevealPhaseChange?.(phase);
  }, [phase, onRevealPhaseChange]);

  const labels = lang === 'ar'
    ? { podium: 'منصة الفائزين', revealing: 'كشف النتائج…' }
    : { podium: 'Winner Podium', revealing: 'Revealing results…' };

  if (top.length === 0) {
    return (
      <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest py-12">
        {lang === 'ar' ? 'لا يوجد لاعبون' : 'No players yet'}
      </p>
    );
  }

  const showThird = !animateReveal || phase >= 1;
  const showSecond = !animateReveal || phase >= 2;
  const showFirst = !animateReveal || phase >= 3;

  return (
    <div className="space-y-5">
      <p
        className="text-center text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 transition-opacity duration-500"
        style={{ opacity: animateReveal && phase < 3 ? 0.7 : 1 }}
      >
        {animateReveal && phase < 3 ? labels.revealing : labels.podium}
      </p>
      <div className="flex items-end justify-center gap-3 md:gap-4 max-w-xl mx-auto px-2 min-h-[220px] md:min-h-[260px]">
        <PodiumSlot player={top[1]} rank={2} visible={showSecond} />
        <PodiumSlot player={top[0]} rank={1} tall visible={showFirst} />
        <PodiumSlot player={top[2]} rank={3} visible={showThird} />
      </div>
    </div>
  );
}

export const PODIUM_REVEAL_PHASE = {
  runners: 4,
  full: 5,
};

export { REVEAL_MS };
