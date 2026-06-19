'use client';

import React from 'react';
import { playersWithRankDelta } from '../../lib/quizSessionHelpers';

function DeltaBadge({ delta }) {
  if (!delta) return <span className="text-zinc-600 text-[10px] font-black w-8 text-center">—</span>;
  if (delta > 0) return <span className="text-emerald-400 text-[10px] font-black w-8 text-center">↑{delta}</span>;
  return <span className="text-red-400 text-[10px] font-black w-8 text-center">↓{Math.abs(delta)}</span>;
}

export default function QuizLeaderboardTop6({ players = [], prevRanks = {}, lang = 'en', title }) {
  const ranked = playersWithRankDelta(players, prevRanks).slice(0, 6);
  const label = title || (lang === 'ar' ? 'أفضل 6 متنافسين' : 'Top 6 competing');
  if (!ranked.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 space-y-3">
      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 text-center">{label}</p>
      <div className="space-y-2">
        {ranked.map((p) => (
          <div key={p.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${p.rank === 1 ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/5 bg-black/30'}`}>
            <span className={`w-7 text-center font-black text-sm ${p.rank === 1 ? 'text-yellow-400' : 'text-zinc-400'}`}>#{p.rank}</span>
            <DeltaBadge delta={p.rankDelta} />
            <span className="flex-1 font-bold text-white text-sm truncate">{p.nickname}</span>
            <span className="font-black text-blue-400 text-sm tabular-nums">{p.score || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
