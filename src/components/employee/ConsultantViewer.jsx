'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle2, MousePointerClick, Timer } from 'lucide-react';
import {
  beginConsultantAttempt,
  clearStaleAttemptIfPassed,
  completeConsultantAttempt,
  getConsultant,
  getProgress,
  heartbeatConsultantAttempt,
} from '../../services/consultantService';
import { PROGRESS_HEARTBEAT_MS, PROGRESS_RESULT } from '../../lib/consultants/constants';

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
  const activeRef = useRef(true);
  const dwellRef = useRef(0);
  const clicksRef = useRef(0);
  const tickRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reviewModeRef = useRef(false);

  const minDwell = Number(consultant?.minDwellSeconds) || 300;
  const remaining = Math.max(0, minDwell - dwell);
  const progressPct = Math.min(100, Math.round((dwell / minDwell) * 100));

  const primaryAsset = consultant?.assets?.[0] || null;
  const isPdf = primaryAsset && /\.pdf$/i.test(primaryAsset.fileName || '');
  const isImage =
    primaryAsset &&
    (/\.(png|jpe?g|webp|gif)$/i.test(primaryAsset.fileName || '') ||
      String(primaryAsset.mime || '').startsWith('image/') ||
      String(primaryAsset.url || '').startsWith('data:image/'));

  const bumpClick = useCallback(() => {
    if (reviewModeRef.current) return;
    clicksRef.current += 1;
    setClicks(clicksRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setReviewMode(false);
      reviewModeRef.current = false;
      try {
        const c = await getConsultant(consultantId);
        if (cancelled) return;
        if (!c) throw new Error('Consultant not found');
        setConsultant(c);

        let alreadyPassed = false;
        let prog = null;
        if (uid) {
          prog = await getProgress(uid, consultantId);
          alreadyPassed =
            prog?.bestResult === PROGRESS_RESULT.PASSED || prog?.bestResult === 'passed';
        }
        if (cancelled) return;

        if (alreadyPassed) {
          setReviewMode(true);
          reviewModeRef.current = true;
          if (uid) await clearStaleAttemptIfPassed(uid, consultantId);
        } else if (uid) {
          const started = await beginConsultantAttempt(uid, c);
          // Resume dwell/clicks from an open attempt so Complete stays available.
          const dwellSec = Math.max(0, Math.floor(Number(started?.currentAttempt?.dwellSeconds) || 0));
          const clickSec = Math.max(0, Math.floor(Number(started?.currentAttempt?.clickCount) || 0));
          dwellRef.current = dwellSec;
          clicksRef.current = clickSec;
          setDwell(dwellSec);
          setClicks(clickSec);
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
    if (reviewMode) {
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
      if (!activeRef.current || reviewModeRef.current) return;
      dwellRef.current += 1;
      setDwell(dwellRef.current);
    }, 1000);

    heartbeatRef.current = window.setInterval(() => {
      if (!uid || !consultantId || reviewModeRef.current) return;
      void heartbeatConsultantAttempt(uid, consultantId, {
        dwellSeconds: dwellRef.current,
        clickCount: clicksRef.current,
      });
    }, PROGRESS_HEARTBEAT_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (tickRef.current) clearInterval(tickRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [uid, consultantId, reviewMode]);

  async function finish({ forceFail = false } = {}) {
    if (reviewMode) {
      onBack?.();
      return;
    }
    if (!uid || !consultant) return;
    setBusy(true);
    try {
      const result = await completeConsultantAttempt(uid, consultant, {
        dwellSeconds: dwellRef.current,
        clickCount: clicksRef.current,
        forceFail,
      });
      if (result.passed) {
        setPassModal(true);
        onFinished?.(result);
      } else {
        setFailModal({
          remainingSeconds: result.remainingSeconds,
          minDwellSeconds: result.minDwellSeconds,
          dwellSeconds: dwellRef.current,
        });
        onFinished?.(result);
      }
    } catch (err) {
      setError(err?.message || 'Could not save progress');
    } finally {
      setBusy(false);
    }
  }

  async function rejoin() {
    setFailModal(null);
    setPassModal(false);
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
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-[11px] text-emerald-200/90">
          You already passed this tip. Re-open anytime to review — no timer or completion check.
        </div>
      )}

      {primaryAsset ? (
        <div
          className="rounded-[1.5rem] border border-white/10 overflow-hidden bg-zinc-950 min-h-[420px]"
          onClick={bumpClick}
        >
          {isPdf ? (
            <iframe
              title={primaryAsset.fileName}
              src={primaryAsset.url}
              className="w-full h-[70vh] bg-white"
            />
          ) : isImage ? (
            <div className="p-4 flex items-center justify-center bg-zinc-900 min-h-[420px]">
              <img
                src={primaryAsset.url}
                alt={primaryAsset.fileName}
                className="max-w-full max-h-[70vh] object-contain rounded-xl pointer-events-none"
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
        <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 p-6 space-y-2">
          <p className="text-sm text-amber-200 font-semibold">No file attached.</p>
          {(consultant.summary_en || consultant.summary_ar) && (
            <p className="text-sm text-zinc-300 pt-2 whitespace-pre-wrap">
              {consultant.summary_en || consultant.summary_ar}
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
              disabled={busy}
              onClick={() => void finish()}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              Mark complete
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void finish({ forceFail: true })}
              className="px-5 py-3 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-[11px] font-black uppercase tracking-widest"
            >
              Exit &amp; record
            </button>
          </>
        )}
      </div>

      {failModal && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-[2rem] border border-red-500/30 bg-zinc-950 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-sm font-black uppercase tracking-widest">Course not completed</h3>
            </div>
            <p className="text-sm text-zinc-300">
              You did not complete the required reading time. You are considered failed for this attempt.
            </p>
            <p className="text-xs text-amber-300">
              Time remaining for reading: {fmt(failModal.remainingSeconds)} (required {fmt(failModal.minDwellSeconds)}, spent {fmt(failModal.dwellSeconds)}).
            </p>
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
              Active time {fmt(dwell)} · {clicks} clicks recorded.
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
