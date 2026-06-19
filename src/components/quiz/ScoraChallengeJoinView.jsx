'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';
import { getQuizSessionByPin, joinQuizSession } from '../../services/quizService';
import { QUIZ_PIN_LENGTH } from '../../constants/quiz';
import { normalizeQuizSettings } from '../../lib/quizSessionHelpers';
import { scoraChallengePlayPath } from '../../constants/scoraChallengePaths';

const NICK_PARTS = ['Swift', 'Blue', 'Mega', 'Super', 'Cosmic', 'Turbo', 'Nova', 'Pixel', 'Flash', 'Star'];
const NICK_SUFFIX = ['Fox', 'Wolf', 'Hawk', 'Tiger', 'Eagle', 'Ninja', 'Hero', 'Ace', 'Pro', 'King'];

function randomNickname() {
  const a = NICK_PARTS[Math.floor(Math.random() * NICK_PARTS.length)];
  const b = NICK_SUFFIX[Math.floor(Math.random() * NICK_SUFFIX.length)];
  return `${a}${b}${Math.floor(Math.random() * 90) + 10}`;
}

const T = {
  en: {
    pinLabel: 'Game PIN',
    nickLabel: 'Nickname',
    enter: 'Enter',
    join: 'Join',
    joining: 'Joining…',
    back: '← Back',
    lang: 'العربية',
    pinIncomplete: 'Enter the full 6-digit game PIN.',
    noActiveGame: 'No active game with this PIN yet. Ask your host to start, then try again.',
    nickRequired: 'Enter a nickname (at least 2 characters).',
    generate: 'Random name',
    waiting: 'Enter the PIN from your host when the game starts.',
  },
  ar: {
    pinLabel: 'رمز اللعبة',
    nickLabel: 'الاسم المستعار',
    enter: 'دخول',
    join: 'انضم',
    joining: 'جاري الانضمام…',
    back: '→ رجوع',
    lang: 'English',
    pinIncomplete: 'أدخل رمز اللعبة المكون من 6 أرقام.',
    noActiveGame: 'لا توجد لعبة نشطة بهذا الرمز بعد. اطلب من المضيف البدء ثم حاول مرة أخرى.',
    nickRequired: 'أدخل اسماً مستعاراً (حرفان على الأقل).',
    generate: 'اسم عشوائي',
    waiting: 'أدخل الرمز من المضيف عند بدء اللعبة.',
  },
};

function KahootBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#5c2d9e]/60 blur-2xl" />
      <div className="absolute top-1/4 -right-20 h-80 w-80 rounded-full bg-[#7b3eb8]/50 blur-2xl" />
      <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-[#3d1278]/70 blur-3xl" />
      <div className="absolute bottom-10 right-1/3 h-48 w-48 rounded-full bg-[#9b59d0]/30 blur-xl" />
    </div>
  );
}

export default function ScoraChallengeJoinView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState(searchParams.get('lang') === 'ar' ? 'ar' : 'en');
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [sessionPreview, setSessionPreview] = useState(null);
  const [sessionSettings, setSessionSettings] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = T[lang];

  useEffect(() => {
    const p = searchParams.get('pin');
    if (p) setPin(p.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH));
  }, [searchParams]);

  const handlePinStep = async (e) => {
    e.preventDefault();
    setError('');
    const code = pin.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH);
    if (code.length !== QUIZ_PIN_LENGTH) {
      setError(t.pinIncomplete);
      return;
    }
    setLoading(true);
    try {
      const session = await getQuizSessionByPin(code);
      if (!session) {
        setError(t.noActiveGame);
        return;
      }
      const settings = normalizeQuizSettings(session.settings);
      setSessionPreview(session);
      setSessionSettings(settings);
      setPin(code);
      setStep(2);
      if (settings.nicknameGenerator && !nickname.trim()) {
        setNickname(randomNickname());
      }
    } catch {
      setError(t.noActiveGame);
    } finally {
      setLoading(false);
    }
  };

  const doJoin = async () => {
    if (!sessionPreview) return;
    const nick = nickname.trim();
    if (nick.length < 2) {
      setError(t.nickRequired);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { playerId } = await joinQuizSession(sessionPreview.id, nick);
      try { sessionStorage.setItem(`quiz_nick_${sessionPreview.id}`, nick); } catch { /* ignore */ }
      const settings = normalizeQuizSettings(sessionPreview.settings);
      const playLang = settings.defaultLanguage === 'ar' ? 'ar' : settings.defaultLanguage === 'en' ? 'en' : lang;
      router.push(`${scoraChallengePlayPath(sessionPreview.id)}?playerId=${playerId}&lang=${playLang}`);
    } catch (err) {
      setError(err.message || t.noActiveGame);
    } finally {
      setLoading(false);
    }
  };

  const handleNickStep = async (e) => {
    e.preventDefault();
    await doJoin();
  };

  const goBack = () => {
    setStep(1);
    setError('');
    setSessionPreview(null);
    setSessionSettings(null);
  };

  const showGenerator = sessionSettings?.nicknameGenerator;

  return (
    <div className="relative min-h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <KahootBackdrop />

      <button
        type="button"
        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        className="absolute top-5 right-5 z-20 flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-bold"
      >
        <Globe className="w-4 h-4" />
        {t.lang}
      </button>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-4xl md:text-6xl font-black text-white text-center mb-10 md:mb-14 drop-shadow-md tracking-tight">
          SCORA Challenge
        </h1>

        {step === 1 ? (
          <form onSubmit={handlePinStep} className="w-full max-w-md">
            <div className="bg-white rounded-sm shadow-2xl overflow-hidden">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, QUIZ_PIN_LENGTH))}
                className="w-full px-4 py-5 md:py-6 text-center text-xl md:text-2xl font-bold text-zinc-800 placeholder:text-zinc-400 border-0 outline-none focus:ring-0"
                inputMode="numeric"
                placeholder={t.pinLabel}
                autoComplete="off"
                autoFocus
                aria-label={t.pinLabel}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 md:py-5 bg-[#333] hover:bg-[#222] disabled:opacity-60 text-white text-lg md:text-xl font-black uppercase tracking-wide transition-colors"
              >
                {loading ? t.joining : t.enter}
              </button>
            </div>
            {error && (
              <p className="mt-4 text-center text-amber-200 text-sm font-bold leading-relaxed px-2">{error}</p>
            )}
            {!error && (
              <p className="mt-6 text-center text-white/75 text-sm font-medium max-w-sm mx-auto">{t.waiting}</p>
            )}
          </form>
        ) : (
          <form onSubmit={handleNickStep} className="w-full max-w-md space-y-4">
            <p className="text-center text-white/90 text-lg font-black tracking-[0.35em] mb-2">{pin}</p>
            <div className="bg-white rounded-sm shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{t.nickLabel}</span>
                {showGenerator && (
                  <button
                    type="button"
                    onClick={() => setNickname(randomNickname())}
                    className="text-[10px] font-black uppercase text-[#46178f] hover:underline"
                  >
                    {t.generate}
                  </button>
                )}
              </div>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                className="w-full px-4 py-5 md:py-6 text-center text-xl md:text-2xl font-bold text-zinc-800 placeholder:text-zinc-400 border-0 outline-none focus:ring-0"
                placeholder={t.nickLabel}
                autoComplete="nickname"
                autoFocus
                aria-label={t.nickLabel}
              />
              <button
                type="submit"
                disabled={loading || nickname.trim().length < 2}
                className="w-full py-4 md:py-5 bg-[#333] hover:bg-[#222] disabled:opacity-60 text-white text-lg md:text-xl font-black uppercase tracking-wide transition-colors"
              >
                {loading ? t.joining : t.enter}
              </button>
            </div>
            {error && (
              <p className="text-center text-amber-200 text-sm font-bold leading-relaxed px-2">{error}</p>
            )}
            <button
              type="button"
              onClick={goBack}
              className="w-full text-center text-white/80 hover:text-white text-sm font-bold py-2"
            >
              {t.back}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
