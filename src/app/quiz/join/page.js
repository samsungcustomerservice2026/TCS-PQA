'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getQuizSessionByPin, joinQuizSession } from '../../../services/quizService';
import { QUIZ_PIN_LENGTH } from '../../../constants/quiz';

const T = {
  en: {
    title: 'Join Live Quiz',
    subtitle: 'Enter the 6-digit game code from your host',
    pin: 'Game code',
    nick: 'Nickname',
    join: 'Join game',
    joining: 'Joining…',
    lang: 'العربية',
    invalid: 'Invalid or ended game code',
    full: 'Game is full',
  },
  ar: {
    title: 'انضم للاختبار المباشر',
    subtitle: 'أدخل رمز اللعبة المكون من 6 أرقام',
    pin: 'رمز اللعبة',
    nick: 'الاسم المستعار',
    join: 'انضم',
    joining: 'جاري الانضمام…',
    lang: 'English',
    invalid: 'رمز غير صالح أو انتهت اللعبة',
    full: 'اللعبة ممتلئة',
  },
};

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState('en');
  const [pin, setPin] = useState(searchParams.get('pin') || '');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = T[lang];

  useEffect(() => {
    const p = searchParams.get('pin');
    if (p) setPin(p.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH));
  }, [searchParams]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    const code = pin.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH);
    if (code.length !== QUIZ_PIN_LENGTH) {
      setError(t.invalid);
      return;
    }
    if (nickname.trim().length < 2) return;

    setLoading(true);
    try {
      const session = await getQuizSessionByPin(code);
      if (!session) {
        setError(t.invalid);
        return;
      }
      const { playerId } = await joinQuizSession(session.id, nickname.trim());
      try {
        sessionStorage.setItem(`quiz_nick_${session.id}`, nickname.trim());
      } catch { /* ignore */ }
      router.push(`/quiz/play/${session.id}?playerId=${playerId}&lang=${lang}`);
    } catch (err) {
      setError(err.message || t.invalid);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <button
        type="button"
        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
      >
        {t.lang}
      </button>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tight">{t.title}</h1>
          <p className="text-zinc-500 text-sm">{t.subtitle}</p>
        </div>
        <form onSubmit={handleJoin} className="space-y-5 rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.pin}</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH))}
              className="w-full bg-black border border-white/10 rounded-2xl p-4 text-center text-3xl font-black tracking-[0.4em] outline-none focus:border-blue-500"
              inputMode="numeric"
              placeholder="000000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.nick}</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={24}
              className="w-full bg-black border border-white/10 rounded-2xl p-4 text-center text-lg font-bold outline-none focus:border-blue-500"
            />
          </div>
          {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
          >
            {loading ? t.joining : t.join}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function QuizJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <JoinForm />
    </Suspense>
  );
}
