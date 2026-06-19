'use client';

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';

function sortByJoinOrder(players) {
  return [...players].sort((a, b) => {
    const ta = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
    const tb = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
    return ta - tb;
  });
}

export default function QuizParticipantList({
  players = [],
  lang = 'en',
  variant = 'list',
  maxHeight = '280px',
}) {
  const sorted = useMemo(() => sortByJoinOrder(players), [players]);

  const labels = lang === 'ar'
    ? { title: 'المشاركون', empty: 'لا يوجد لاعبون بعد', count: 'لاعب' }
    : { title: 'Participants', empty: 'No players yet', count: 'players' };

  if (variant === 'chips') {
    return (
      <div className="space-y-4 w-full max-w-2xl">
        {sorted.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center">{labels.empty}</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {sorted.map((p) => (
              <span
                key={p.id}
                title={p.nickname}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-zinc-900/80 text-sm font-bold text-white max-w-[14rem] truncate"
              >
                {p.nickname}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 space-y-3">
      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {labels.title}
        </span>
        <span className="text-zinc-600 tabular-nums">{sorted.length}</span>
      </p>
      {sorted.length === 0 ? (
        <p className="text-zinc-600 text-xs text-center py-4">{labels.empty}</p>
      ) : (
        <ul className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight }}>
          {sorted.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-lg px-3 py-2 border border-white/5 bg-black/30"
            >
              <span className="w-6 shrink-0 text-center text-[10px] font-black text-zinc-600 tabular-nums">
                {i + 1}
              </span>
              <span className="flex-1 min-w-0 font-bold text-white text-sm truncate" title={p.nickname}>
                {p.nickname}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
