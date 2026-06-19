'use client';

import React, { useState, useEffect } from 'react';

const RANK_STYLES = {
  1: 'border-yellow-500/50 text-yellow-400 shadow-yellow-500/20',
  2: 'border-zinc-300/40 text-zinc-200',
  3: 'border-orange-600/40 text-orange-400',
};

const REVEAL_MS = {
  third: 600,
  second: 2800,
  first: 5000,
  runners: 20000,
  full: 21500,
};

function PodiumSlot({ player, rank, tall, visible, animate }) {
  if (!player) return <div className="flex-1" />;
  const style = RANK_STYLES[rank] || 'border-white/10 text-white';
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-2 transition-all duration-700 ${
        tall ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'
      } ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-6'}`}
      style={{ transitionDelay: animate && visible ? '0ms' : '0ms' }}
    >
      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center text-xl font-black ${style}`}>
        #{rank}
      </div>
      <p className="text-xs md:text-sm font-black uppercase tracking-wide text-white text-center line-clamp-2 max-w-[9rem]">
        {player.nickname}
      </p>
      <p className="text-[10px] font-bold text-zinc-500">{player.score || 0}</p>
      <div
        className={`w-full rounded-t-xl bg-gradient-to-b from-zinc-700/80 to-zinc-950 border border-white/10 transition-all duration-700 ${
          tall ? 'h-24 md:h-28' : rank === 2 ? 'h-16 md:h-20' : 'h-12 md:h-14'
        } ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
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
    ? { podium: 'منصة الفائزين', pts: 'نقطة', revealing: 'كشف النتائج…' }
    : { podium: 'Winner Podium', pts: 'pts', revealing: 'Revealing results…' };

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
    <div className="space-y-4">
      <p className="text-center text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500">
        {animateReveal && phase < 3 ? labels.revealing : labels.podium}
      </p>
      <div className="flex items-end justify-center gap-2 max-w-lg mx-auto px-2 min-h-[200px]">
        <PodiumSlot player={showSecond ? top[1] : null} rank={2} visible={showSecond} animate={animateReveal} />
        <PodiumSlot player={showFirst ? top[0] : null} rank={1} tall visible={showFirst} animate={animateReveal} />
        <PodiumSlot player={showThird ? top[2] : null} rank={3} visible={showThird} animate={animateReveal} />
      </div>
    </div>
  );
}

export const PODIUM_REVEAL_PHASE = {
  runners: 4,
  full: 5,
};

export { REVEAL_MS };
