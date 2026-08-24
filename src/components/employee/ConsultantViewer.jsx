'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle2, MousePointerClick, Timer } from 'lucide-react';
import {
  beginConsultantAttempt,
  clearStaleAttemptIfPassed,
  completeConsultantAttempt,
  getConsultant,
  getProgress,
  heartbeatConsultantAttempt,
} from '../../services/consultantService';
import {
  DEFAULT_MAX_CHOICE_ATTEMPTS,
  PROGRESS_HEARTBEAT_MS,
  PROGRESS_RESULT,
  TIP_QUESTION_TYPE,
} from '../../lib/consultants/constants';
import { consultantHasQuiz, normalizeTipQuestions } from '../../lib/consultants/schema';

function fmt(sec) {
  const n = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ConsultantViewer({
  consultantId,
  uid,
  onBack,
  onFinished,
}) {
  const [consultant, setConsultant] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [dwell, setDwell] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [failModal, setFailModal] = useState(null);
  const [passModal, setPassModal] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [choiceSelection, setChoiceSelection] = useState(null);
  const [textDraft, setTextDraft] = useState('');
  const [choiceTries, setChoiceTries] = useState(0);
  const [quizHint, setQuizHint] = useState('');
  const [quizRemainSec, setQuizRemainSec] = useState(null);
  const [quizLang, setQuizLang] = useState('en');

  const activeRef = useRef(true);
  const dwellRef = useRef(0);
  const clicksRef = useRef(0);
  const tickRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reviewModeRef = useRef(false);
  const quizOpenRef = useRef(false);
  const quizTimerRef = useRef(null);
  const quizQStartRef = useRef(0);
  const quizAnswersRef = useRef([]);

  const minDwell = Number(consultant?.minDwellSeconds) || 300;
  const remaining = Math.max(0, minDwell - dwell);
  const progressPct = Math.min(100, Math.round((dwell / minDwell) * 100));
  const questions = useMemo(
    () => normalizeTipQuestions(consultant?.questions || []),
    [consultant?.questions],
  );
  const hasQuiz = consultantHasQuiz(consultant);
  const currentQ = questions[quizIndex] || null;

  const primaryAsset = consultant?.assets?.[0] || null;
  const isPdf = primaryAsset && /\.pdf$/i.test(primaryAsset.fileName || '');
  const isImage =
    primaryAsset &&
    (/\.(png|jpe?g|webp|gif)$/i.test(primaryAsset.fileName || '') ||
      String(primaryAsset.mime || '').startsWith('image/') ||
      String(primaryAsset.url || '').startsWith('data:image/'));

  const bumpClick = useCallback(() => {
    if (reviewModeRef.current || quizOpenRef.current) return;
    clicksRef.current += 1;
    setClicks(clicksRef.current);
  }, []);

  const clearQuizTimer = useCallback(() => {
    if (quizTimerRef.current) {
      clearInterval(quizTimerRef.current);
      quizTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    quizOpenRef.current = quizOpen;
  }, [quizOpen]);

  useEffect(() => {
    quizAnswersRef.current = quizAnswers;
  }, [quizAnswers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setReviewMode(false);
      reviewModeRef.current = false;
      setQuizOpen(false);
      try {
        const c = await getConsultant(consultantId);
        if (cancelled) return;
        if (!c) throw new Error('Consultant not found');
        setConsultant(c);

        let alreadyPassed = false;
        if (uid) {
          try {
            const prog = await getProgress(uid, consultantId);
            alreadyPassed =
              prog?.bestResult === PROGRESS_RESULT.PASSED || prog?.bestResult === 'passed';
          } catch (progressErr) {
            if (!cancelled) {
              setError(progressErr?.message || 'Could not load progress');
            }
          }
        }
        if (cancelled) return;

        if (alreadyPassed) {
          setReviewMode(true);
          reviewModeRef.current = true;
          if (uid) await clearStaleAttemptIfPassed(uid, consultantId);
        } else if (uid) {
          try {
            const started = await beginConsultantAttempt(uid, c);
            const dwellSec = Math.max(0, Math.floor(Number(started?.currentAttempt?.dwellSeconds) || 0));
            const clickSec = Math.max(0, Math.floor(Number(started?.currentAttempt?.clickCount) || 0));
            dwellRef.current = dwellSec;
            clicksRef.current = clickSec;
            setDwell(dwellSec);
            setClicks(clickSec);
          } catch (progressErr) {
            setError(progressErr?.message || 'Could not start progress tracking');
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to open');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [consultantId, uid]);

  useEffect(() => {
    if (reviewMode || quizOpen) {
      if (tickRef.current) clearInterval(tickRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      return undefined;
    }

    const onVis = () => {
      activeRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVis);
    onVis();

    tickRef.current = window.setInterval(() => {
      if (!activeRef.current || reviewModeRef.current || quizOpenRef.current) return;
      dwellRef.current += 1;
      setDwell(dwellRef.current);
    }, 1000);

    heartbeatRef.current = window.setInterval(() => {
      if (!uid || !consultantId || reviewModeRef.current || quizOpenRef.current) return;
      void heartbeatConsultantAttempt(uid, consultantId, {
        dwellSeconds: dwellRef.current,
        clickCount: clicksRef.current,
      }).catch((err) => {
        const msg = err?.message || 'Could not save progress';
        setError((prev) => prev || msg);
      });
    }, PROGRESS_HEARTBEAT_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (tickRef.current) clearInterval(tickRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [uid, consultantId, reviewMode, quizOpen]);

  async function persistResult({ forceFail = false, quizFail = false, answers = null } = {}) {
    if (!uid || !consultant) return null;
    setBusy(true);
    try {
      const result = await completeConsultantAttempt(uid, consultant, {
        dwellSeconds: dwellRef.current,
        clickCount: clicksRef.current,
        forceFail,
        quizFail,
        quizAnswers: answers,
      });
      clearQuizTimer();
      setQuizOpen(false);
      if (result.passed) {
        setPassModal(true);
        setFailModal(null);
      } else {
        setFailModal({
          remainingSeconds: result.remainingSeconds,
          minDwellSeconds: result.minDwellSeconds,
          dwellSeconds: dwellRef.current,
          reason: forceFail
            ? 'exit'
            : quizFail || (result.quizRequired && !result.quizPassed)
              ? 'quiz'
              : 'dwell',
        });
      }
      onFinished?.(result);
      return result;
    } catch (err) {
      setError(err?.message || 'Could not save progress');
      return null;
    } finally {
      setBusy(false);
    }
  }

  function startQuizPhase() {
    const qs = normalizeTipQuestions(consultant?.questions || []);
    if (!qs.length) {
      void persistResult({ answers: [] });
      return;
    }
    setQuizAnswers([]);
    quizAnswersRef.current = [];
    setQuizIndex(0);
    setChoiceSelection(null);
    setTextDraft('');
    setChoiceTries(0);
    setQuizHint('');
    setQuizOpen(true);
    quizOpenRef.current = true;
    startQuestionTimer(qs[0]);
  }

  function startQuestionTimer(q) {
    clearQuizTimer();
    quizQStartRef.current = Date.now();
    const limit = Math.max(0, Math.floor(Number(q?.timeLimitSec) || 0));
    if (!limit) {
      setQuizRemainSec(null);
      return;
    }
    setQuizRemainSec(limit);
    quizTimerRef.current = window.setInterval(() => {
      setQuizRemainSec((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearQuizTimer();
          void onQuestionTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function onQuestionTimeout() {
    const q = questions[quizIndex];
    if (!q) return;
    const spent = Math.max(0, Math.round((Date.now() - quizQStartRef.current) / 1000));
    const nextAnswers = [
      ...quizAnswersRef.current,
      {
        questionId: q.id,
        type: q.type,
        selectedIndex: null,
        textAnswer: '',
        timedOut: true,
        choiceTries,
        timeSpentSec: spent,
      },
    ];
    setQuizAnswers(nextAnswers);
    quizAnswersRef.current = nextAnswers;
    await persistResult({ quizFail: true, answers: nextAnswers });
  }

  async function finish({ forceFail = false } = {}) {
    if (reviewMode) {
      onBack?.();
      return;
    }
    if (!uid || !consultant) return;

    if (forceFail) {
      await persistResult({ forceFail: true, answers: quizAnswersRef.current });
      return;
    }

    if (dwellRef.current < minDwell) {
      await persistResult({});
      return;
    }

    if (hasQuiz) {
      startQuizPhase();
      return;
    }

    await persistResult({ answers: [] });
  }

  function advanceOrComplete(nextAnswers) {
    const nextIdx = quizIndex + 1;
    if (nextIdx >= questions.length) {
      void persistResult({ answers: nextAnswers });
      return;
    }
    setQuizAnswers(nextAnswers);
    quizAnswersRef.current = nextAnswers;
    setQuizIndex(nextIdx);
    setChoiceSelection(null);
    setTextDraft('');
    setChoiceTries(0);
    setQuizHint('');
    startQuestionTimer(questions[nextIdx]);
  }

  function submitChoice() {
    const q = currentQ;
    if (!q || choiceSelection == null) {
      setQuizHint('Select an option first.');
      return;
    }
    const spent = Math.max(0, Math.round((Date.now() - quizQStartRef.current) / 1000));
    const correct = Number(choiceSelection) === Number(q.correctIndex);
    const maxTries = Number(q.maxChoiceAttempts) || DEFAULT_MAX_CHOICE_ATTEMPTS;

    if (correct) {
      clearQuizTimer();
      const nextAnswers = [
        ...quizAnswersRef.current,
        {
          questionId: q.id,
          type: q.type,
          selectedIndex: Number(choiceSelection),
          textAnswer: '',
          timedOut: false,
          choiceTries: choiceTries + 1,
          timeSpentSec: spent,
        },
      ];
      advanceOrComplete(nextAnswers);
      return;
    }

    const tries = choiceTries + 1;
    setChoiceTries(tries);
    if (tries >= maxTries) {
      clearQuizTimer();
      const nextAnswers = [
        ...quizAnswersRef.current,
        {
          questionId: q.id,
          type: q.type,
          selectedIndex: Number(choiceSelection),
          textAnswer: '',
          timedOut: false,
          choiceTries: tries,
          timeSpentSec: spent,
        },
      ];
      setQuizAnswers(nextAnswers);
      quizAnswersRef.current = nextAnswers;
      void persistResult({ quizFail: true, answers: nextAnswers });
      return;
    }
    setQuizHint(`Incorrect. ${maxTries - tries} attempt(s) left.`);
    setChoiceSelection(null);
  }

  function submitText() {
    const q = currentQ;
    const text = String(textDraft || '').trim();
    if (!q || !text) {
      setQuizHint('Write your answer before submitting.');
      return;
    }
    clearQuizTimer();
    const spent = Math.max(0, Math.round((Date.now() - quizQStartRef.current) / 1000));
    const nextAnswers = [
      ...quizAnswersRef.current,
      {
        questionId: q.id,
        type: q.type,
        selectedIndex: null,
        textAnswer: text,
        timedOut: false,
        choiceTries: 0,
        timeSpentSec: spent,
      },
    ];
    advanceOrComplete(nextAnswers);
  }

  async function rejoin() {
    clearQuizTimer();
    setFailModal(null);
    setPassModal(false);
    setQuizOpen(false);
    quizOpenRef.current = false;
    setQuizAnswers([]);
    quizAnswersRef.current = [];
    setQuizIndex(0);
    dwellRef.current = 0;
    clicksRef.current = 0;
    setDwell(0);
    setClicks(0);
    setReviewMode(false);
    reviewModeRef.current = false;
    if (uid && consultant) {
      await beginConsultantAttempt(uid, consultant);
    }
  }

  useEffect(() => () => clearQuizTimer(), [clearQuizTimer]);

  if (busy && !consultant) {
    return <p className="text-sm text-zinc-500">Loading consultant…</p>;
  }

  if (error && !consultant) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={onBack} className="text-xs text-zinc-500">
          ← Back
        </button>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const prompt =
    quizLang === 'ar' && currentQ?.prompt_ar
      ? currentQ.prompt_ar
      : currentQ?.prompt_en || currentQ?.prompt_ar || '';
  const options =
    quizLang === 'ar' && (currentQ?.options_ar || []).some(Boolean)
      ? currentQ.options_ar
      : currentQ?.options_en || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (reviewMode) onBack?.();
            else void finish({ forceFail: dwellRef.current < minDwell });
          }}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {reviewMode ? 'Back' : 'Leave'}
        </button>
        <h2 className="text-lg font-black text-white truncate">{consultant?.title_en}</h2>
        {reviewMode && (
          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
            Passed · review
          </span>
        )}
        {hasQuiz && !reviewMode && (
          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
            Quiz after timer
          </span>
        )}
      </div>

      {!reviewMode ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 space-y-3">
          <div className="flex flex-wrap gap-4 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              Active time {fmt(dwell)} / {fmt(minDwell)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-blue-400" />
              Clicks {clicks}
            </span>
            <span className="text-amber-300">
              Time remaining to pass: {fmt(remaining)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all ${progressPct >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500">
            Only time with this screen visible counts. Background time is paused.
            {hasQuiz ? ' After the timer, answer the confirmation question(s).' : ''}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-[11px] text-emerald-200/90">
          You already passed this tip. Re-open anytime to review — no timer or completion check.
        </div>
      )}

      <div className="rounded-[1.5rem] border border-white/10 overflow-hidden bg-zinc-950">
        {primaryAsset ? (
          <div onClick={bumpClick}>
            {isPdf ? (
              <iframe
                title={primaryAsset.fileName}
                src={primaryAsset.url}
                className="w-full h-[55vh] bg-white"
              />
            ) : isImage ? (
              <div className="p-4 flex items-center justify-center bg-zinc-900">
                <img
                  src={primaryAsset.url}
                  alt={primaryAsset.fileName || consultant?.title_en || 'Technical tip'}
                  className="max-w-full max-h-[50vh] object-contain rounded-xl pointer-events-none"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="p-8 space-y-4 text-center">
                <p className="text-sm text-zinc-300">{primaryAsset.fileName}</p>
                <p className="text-xs text-zinc-500">
                  Open the file, review it carefully, then return here.
                </p>
                <a
                  href={primaryAsset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex px-5 py-3 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest"
                >
                  Open file
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <p className="text-sm text-amber-200 font-semibold">No file attached.</p>
          </div>
        )}

        {(consultant?.summary_en || consultant?.summary_ar) && (
          <div
            className="px-5 py-4 border-t border-white/10 bg-zinc-900 space-y-2"
            onClick={bumpClick}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              Tip instructions
            </p>
            {consultant.summary_en && (
              <p className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
                {consultant.summary_en}
              </p>
            )}
            {consultant.summary_ar &&
              consultant.summary_ar !== consultant.summary_en && (
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed" dir="rtl">
                  {consultant.summary_ar}
                </p>
              )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
          {/permission|insufficient/i.test(error) && (
            <p className="text-[11px] text-red-200/80 mt-1">
              Progress could not be saved. Ask an admin to publish updated Firestore rules, then refresh and try again.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {reviewMode ? (
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-xl bg-zinc-800 border border-white/10 text-zinc-200 text-[11px] font-black uppercase tracking-widest"
          >
            Back to dashboard
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={busy || quizOpen}
              onClick={() => {
                setError('');
                void finish();
              }}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              {hasQuiz ? (dwell >= minDwell ? 'Start quiz' : 'Mark complete') : 'Mark complete'}
            </button>
            <button
              type="button"
              disabled={busy || quizOpen}
              onClick={() => {
                setError('');
                void finish({ forceFail: true });
              }}
              className="px-5 py-3 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-[11px] font-black uppercase tracking-widest"
            >
              Exit &amp; record
            </button>
          </>
        )}
      </div>

      {quizOpen && currentQ && (
        <div className="fixed inset-0 z-[195] flex items-center justify-center p-4 bg-black/85">
          <div className="w-full max-w-lg rounded-[2rem] border border-cyan-500/30 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                Question {quizIndex + 1} / {questions.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuizLang((l) => (l === 'en' ? 'ar' : 'en'))}
                  className="px-2 py-1 rounded-lg border border-white/10 text-[10px] font-black text-zinc-400"
                >
                  {quizLang === 'en' ? 'ع' : 'EN'}
                </button>
                {quizRemainSec != null && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                      quizRemainSec <= 10 ? 'text-red-400' : 'text-amber-300'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    {fmt(quizRemainSec)}
                  </span>
                )}
              </div>
            </div>
            <p
              className="text-sm text-white font-semibold leading-relaxed whitespace-pre-wrap"
              dir={quizLang === 'ar' ? 'rtl' : 'ltr'}
            >
              {prompt}
            </p>

            {currentQ.type === TIP_QUESTION_TYPE.TEXT ? (
              <textarea
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                rows={4}
                placeholder={quizLang === 'ar' ? 'اكتب إجابتك…' : 'Write your answer…'}
                dir={quizLang === 'ar' ? 'rtl' : 'ltr'}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              />
            ) : (
              <div className="space-y-2" dir={quizLang === 'ar' ? 'rtl' : 'ltr'}>
                {(options || []).map((opt, oi) => {
                  if (!String(opt || '').trim() && !(currentQ.options_en || [])[oi]) return null;
                  const label =
                    String(opt || '').trim() || String((currentQ.options_en || [])[oi] || '').trim();
                  if (!label) return null;
                  return (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer text-sm ${
                        choiceSelection === oi
                          ? 'border-cyan-400/50 bg-cyan-500/10 text-white'
                          : 'border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tip-quiz-choice"
                        checked={choiceSelection === oi}
                        onChange={() => setChoiceSelection(oi)}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            )}

            {quizHint && <p className="text-xs text-amber-300">{quizHint}</p>}
            {currentQ.type === TIP_QUESTION_TYPE.CHOICE && (
              <p className="text-[10px] text-zinc-500">
                Attempts used: {choiceTries} / {currentQ.maxChoiceAttempts || DEFAULT_MAX_CHOICE_ATTEMPTS}
              </p>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (currentQ.type === TIP_QUESTION_TYPE.TEXT) submitText();
                else submitChoice();
              }}
              className="w-full py-3 rounded-xl bg-cyan-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              Submit answer
            </button>
          </div>
        </div>
      )}

      {failModal && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-[2rem] border border-red-500/30 bg-zinc-950 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-sm font-black uppercase tracking-widest">Course not completed</h3>
            </div>
            <p className="text-sm text-zinc-300">
              {failModal.reason === 'quiz'
                ? 'Quiz failed (wrong answers or time expired). You must attend the tip again from the start.'
                : 'You did not complete the required reading time. You are considered failed for this attempt.'}
            </p>
            {failModal.reason !== 'quiz' && (
              <p className="text-xs text-amber-300">
                Time remaining for reading: {fmt(failModal.remainingSeconds)} (required{' '}
                {fmt(failModal.minDwellSeconds)}, spent {fmt(failModal.dwellSeconds)}).
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void rejoin()}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest"
              >
                Rejoin course
              </button>
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 text-[11px] font-black uppercase tracking-widest"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {passModal && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-[2rem] border border-emerald-500/30 bg-zinc-950 p-6 space-y-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Passed</h3>
            <p className="text-sm text-zinc-400">
              Active time {fmt(dwell)} · {clicks} clicks recorded
              {hasQuiz ? ' · quiz completed' : ''}.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
