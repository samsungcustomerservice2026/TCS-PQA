'use client';

import React from 'react';
import Link from 'next/link';
import { SCORA_CHALLENGE_PATHS } from '../../constants/scoraChallengePaths';
import QuizChallengeHeader from './QuizChallengeHeader';

const T = {
  en: {
    title: 'Game over',
    subtitle: 'Thanks for playing SCORA Challenge',
    join: 'Join another game',
  },
  ar: {
    title: 'انتهت اللعبة',
    subtitle: 'شكراً لمشاركتك في تحدي SCORA',
    join: 'انضم للعبة أخرى',
  },
};

export default function QuizJoinAnotherGame({ lang = 'en', className = '' }) {
  const t = T[lang] || T.en;

  return (
    <div className={`fixed inset-0 bg-black flex flex-col items-center justify-start sm:justify-center p-6 overflow-y-auto ${className}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-8">
        <QuizChallengeHeader lang={lang} />
        <div className="space-y-2">
          <p className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{t.title}</p>
          <p className="text-zinc-500 text-sm">{t.subtitle}</p>
        </div>
        <Link
          href={`${SCORA_CHALLENGE_PATHS.join}?lang=${lang}`}
          className="w-full max-w-sm py-6 md:py-8 px-8 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg md:text-xl uppercase tracking-widest text-center shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {t.join}
        </Link>
      </div>
    </div>
  );
}
