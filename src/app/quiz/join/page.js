'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getQuizSessionByPin, joinQuizSession } from '../../../services/quizService';
import { QUIZ_PIN_LENGTH } from '../../../constants/quiz';
import { normalizeQuizSettings } from '../../../lib/quizSessionHelpers';
import { scoraChallengePlayPath } from '../../../constants/scoraChallengePaths';
import { scoraChallengeJoinUrl } from '../../../constants/scoraChallengePaths';
import QuizJoinQR from '../../../components/quiz/QuizJoinQR';

const NICK_PARTS = ['Swift', 'Blue', 'Mega', 'Super', 'Cosmic', 'Turbo', 'Nova', 'Pixel', 'Flash', 'Star'];
const NICK_SUFFIX = ['Fox', 'Wolf', 'Hawk', 'Tiger', 'Eagle', 'Ninja', 'Hero', 'Ace', 'Pro', 'King'];

function randomNickname() {
  const a = NICK_PARTS[Math.floor(Math.random() * NICK_PARTS.length)];
  const b = NICK_SUFFIX[Math.floor(Math.random() * NICK_SUFFIX.length)];
  return `${a}${b}${Math.floor(Math.random() * 90) + 10}`;
}

const T = {
  en: {
    title: 'SCORA Challenge',
    subtitle: 'Enter the 6-digit game code from your host',
    hint: 'This page always works — enter your code when the host starts a live game.',
    pin: 'Game code',
    nick: 'Nickname',
    join: 'Join game',
    next: 'Continue',
    joining: 'Joining…',
    lang: 'العربية',
    invalid: 'No active game with this code. Ask your host to start SCORA Challenge, then try again.',
    generate: 'Generate nickname',
    scan: 'SCORA Challenge join link',
  },
  ar: {
    title: 'تحدي SCORA',
    subtitle: 'أدخل رمز اللعبة المكون من 6 أرقام',
    hint: 'هذه الصفحة متاحة دائماً — أدخل الرمز عندما يبدأ المضيف اللعبة.',
    pin: 'رمز اللعبة',
    nick: 'الاسم المستعار',
    join: 'انضم',
    next: 'متابعة',
    joining: 'جاري الانضمام…',
    lang: 'English',
    invalid: 'لا توجد لعبة نشطة بهذا الرمز. اطلب من المضيف بدء التحدي ثم حاول مرة أخرى.',
    generate: 'اسم عشوائي',
    scan: 'رابط الانضمام لتحدي SCORA',
  },
};

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState(searchParams.get('lang') === 'ar' ? 'ar' : 'en');
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState(searchParams.get('pin') || '');
  const [nickname, setNickname] = useState('');
  const [sessionPreview, setSessionPreview] = useState(null);
  const [sessionSettings, setSessionSettings] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = T[lang];

  const pinFromUrl = searchParams.get('pin');
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    setJoinUrl(scoraChallengeJoinUrl(pinFromUrl || pin || undefined, window.location.origin));
  }, [pinFromUrl, pin]);

  useEffect(() => {
    const p = searchParams.get('pin');
    if (p) setPin(p.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH));
  }, [searchParams]);

  const validatePin = async () => {
    setError('');
    const code = pin.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH);
    if (code.length !== QUIZ_PIN_LENGTH) {
      setError(t.invalid);
      return null;
    }
    const session = await getQuizSessionByPin(code);
    if (!session) {
      setError(t.invalid);
      return null;
    }
    setSessionPreview(session);
    setSessionSettings(normalizeQuizSettings(session.settings));
    return session;
  };

  const handlePinStep = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await validatePin();
      if (!session) return;
      const settings = normalizeQuizSettings(session.settings);
      if (settings.twoStepJoin) setStep(2);
      else if (nickname.trim().length >= 2) await doJoin(session, nickname.trim());
      else setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const doJoin = async (session, nick) => {
    setLoading(true);
    try {
      const { playerId } = await joinQuizSession(session.id, nick);
      try { sessionStorage.setItem(`quiz_nick_${session.id}`, nick); } catch { /* ignore */ }
      const settings = normalizeQuizSettings(session.settings);
      const playLang = settings.defaultLanguage === 'ar' ? 'ar' : settings.defaultLanguage === 'en' ? 'en' : lang;
      router.push(`${scoraChallengePlayPath(session.id)}?playerId=${playerId}&lang=${playLang}`);
    } catch (err) {
      setError(err.message || t.invalid);
    } finally {
      setLoading(false);
    }
  };

  const handleNickStep = async (e) => {
    e.preventDefault();
    if (nickname.trim().length < 2 || !sessionPreview) return;
    await doJoin(sessionPreview, nickname.trim());
  };

  const showGenerator = sessionSettings?.nicknameGenerator ?? false;
  const twoStep = sessionSettings?.twoStepJoin ?? false;
  const showNickOnStep1 = !twoStep;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">{t.lang}</button>

      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-400">SCORA Challenge</p>
          <h1 className="text-3xl font-black uppercase tracking-tight">{t.title}</h1>
          <p className="text-zinc-500 text-sm">{step === 1 ? t.subtitle : t.nick}</p>
          {step === 1 && <p className="text-[11px] text-zinc-600 max-w-sm mx-auto">{t.hint}</p>}
        </div>

        {step === 1 && joinUrl && (
          <div className="flex justify-center">
            <QuizJoinQR url={joinUrl} pin={pinFromUrl || undefined} title={t.scan} size={140} />
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handlePinStep} className="space-y-5 rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.pin}</label>
              <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH))} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-center text-3xl font-black tracking-[0.4em] outline-none focus:border-blue-500" inputMode="numeric" placeholder="000000" />
            </div>
            {showNickOnStep1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.nick}</label>
                  {showGenerator && (
                    <button type="button" onClick={() => setNickname(randomNickname())} className="text-[9px] font-black uppercase text-blue-400">{t.generate}</button>
                  )}
                </div>
                <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={24} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-center text-lg font-bold outline-none focus:border-blue-500" />
              </div>
            )}
            {error && <p className="text-amber-400 text-xs text-center font-bold leading-relaxed">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 rounded-2xl font-black text-sm uppercase tracking-widest">
              {loading ? t.joining : (twoStep ? t.next : t.join)}
            </button>
          </form>
        ) : (
          <form onSubmit={handleNickStep} className="space-y-5 rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
            <p className="text-center text-2xl font-black text-blue-400 tracking-widest">{pin}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.nick}</label>
                {(showGenerator || sessionSettings?.nicknameGenerator) && (
                  <button type="button" onClick={() => setNickname(randomNickname())} className="text-[9px] font-black uppercase text-blue-400">{t.generate}</button>
                )}
              </div>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={24} autoFocus className="w-full bg-black border border-white/10 rounded-2xl p-4 text-center text-lg font-bold outline-none focus:border-blue-500" />
            </div>
            {error && <p className="text-amber-400 text-xs text-center font-bold">{error}</p>}
            <button type="submit" disabled={loading || nickname.trim().length < 2} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-40">{loading ? t.joining : t.join}</button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-zinc-500 text-[10px] font-black uppercase">← Back</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ScoraChallengeJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">SCORA Challenge…</div>}>
      <JoinForm />
    </Suspense>
  );
}
