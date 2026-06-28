'use client';

import { SCORA_CHALLENGE_NAME, SCORA_CHALLENGE_NAME_AR } from '../../lib/quizSessionHelpers';

export default function QuizChallengeHeader({ lang = 'en', pin, division, subtitle }) {
  return (
    <div className="text-center space-y-1 shrink-0 w-full min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-400">
        {lang === 'ar' ? SCORA_CHALLENGE_NAME_AR : SCORA_CHALLENGE_NAME}
      </p>
      {pin && <p className="text-2xl sm:text-3xl md:text-5xl font-black text-blue-400 tracking-[0.15em] sm:tracking-[0.25em] break-all">{pin}</p>}
      {(division || subtitle) && (
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
          {[division, subtitle].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}
