'use client';

import React from 'react';

const RANK_STYLES = {
  1: 'border-yellow-500/50 text-yellow-400 shadow-yellow-500/20',
  2: 'border-zinc-300/40 text-zinc-200',
  3: 'border-orange-600/40 text-orange-400',
};

export default function QuizPodium({ players = [], lang = 'en' }) {
  const top = players.slice(0, 3);
  const labels = lang === 'ar'
    ? { podium: 'منصة الفائزين', pts: 'نقطة' }
    : { podium: 'Winner Podium', pts: 'pts' };

  const PodiumSlot = ({ player, rank, tall }) => {
    if (!player) return <div className="flex-1" />;
    const style = RANK_STYLES[rank] || 'border-white/10 text-white';
    return (
      <div className={`flex flex-1 flex-col items-center gap-2 ${tall ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'}`}>
        <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black ${style}`}>
          #{rank}
        </div>
        <p className="text-xs font-black uppercase tracking-wide text-white text-center line-clamp-2 max-w-[8rem]">
          {player.nickname}
        </p>
        <p className="text-[10px] font-bold text-zinc-500">{player.score || 0} {labels.pts}</p>
        <div
          className={`w-full rounded-t-xl bg-gradient-to-b from-zinc-700/80 to-zinc-950 border border-white/10 ${
            tall ? 'h-24' : rank === 2 ? 'h-16' : 'h-12'
          }`}
        />
      </div>
    );
  };

  if (top.length === 0) {
    return (
      <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest py-12">
        {lang === 'ar' ? 'لا يوجد لاعبون' : 'No players yet'}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500">{labels.podium}</p>
      <div className="flex items-end justify-center gap-2 max-w-lg mx-auto px-2">
        <PodiumSlot player={top[1]} rank={2} />
        <PodiumSlot player={top[0]} rank={1} tall />
        <PodiumSlot player={top[2]} rank={3} />
      </div>
    </div>
  );
}
