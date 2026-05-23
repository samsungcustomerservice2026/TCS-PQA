'use client';

import { useEffect, useRef, useCallback } from 'react';
import { recordConnectivitySignal, recordClickBatch } from '../services/visitorEngagementService';

const IDLE_MS = 45_000;
const TICK_MS = 5_000;
const LAG_THRESHOLD_MS = 500;
const CLICK_FLUSH_MS = 30_000;
const LAG_COOLDOWN_MS = 15_000;

/**
 * Tracks visitor clicks, active time, offline/online, and main-thread lag.
 * Only enable for public (non-admin) sessions.
 */
export function useVisitorEngagement({ enabled, sessionId, appMode, snapshotRef }) {
  const clicksRef = useRef(0);
  const flushedClicksRef = useRef(0);
  const activeMsRef = useRef(0);
  const offlineRef = useRef(0);
  const lagRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());
  const lastLagReportRef = useRef(0);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const flushClicks = useCallback(async () => {
    const delta = clicksRef.current - flushedClicksRef.current;
    if (delta < 1) return;
    flushedClicksRef.current = clicksRef.current;
    await recordClickBatch(delta, { appMode, sessionId });
  }, [appMode, sessionId]);

  const getSnapshot = useCallback(() => ({
    clicks: clicksRef.current,
    pendingClicks: clicksRef.current - flushedClicksRef.current,
    activeMs: activeMsRef.current,
    offlineEvents: offlineRef.current,
    lagEvents: lagRef.current,
    durationMs: Date.now() - (sessionStartRef.current || Date.now()),
    sessionId,
  }), [sessionId]);

  useEffect(() => {
    if (snapshotRef) snapshotRef.current = getSnapshot;
  }, [getSnapshot, snapshotRef]);

  useEffect(() => {
    if (!enabled) return undefined;
    sessionStartRef.current = Date.now();
    clicksRef.current = 0;
    flushedClicksRef.current = 0;
    activeMsRef.current = 0;
    offlineRef.current = 0;
    lagRef.current = 0;

    const onClick = () => {
      clicksRef.current += 1;
      markActivity();
    };
    const onActivity = () => markActivity();

    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onActivity, true);
    document.addEventListener('scroll', onActivity, { passive: true, capture: true });
    document.addEventListener('touchstart', onActivity, { passive: true, capture: true });

    const tick = setInterval(() => {
      if (typeof document === 'undefined' || document.hidden) return;
      if (Date.now() - lastActivityRef.current > IDLE_MS) return;
      activeMsRef.current += TICK_MS;
    }, TICK_MS);

    const clickFlush = setInterval(() => {
      flushClicks();
    }, CLICK_FLUSH_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushClicks();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onOffline = () => {
      offlineRef.current += 1;
      recordConnectivitySignal('offline', { appMode, sessionId });
    };
    const onOnline = () => {
      recordConnectivitySignal('online', { appMode, sessionId });
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    let longTaskObserver;
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration < LAG_THRESHOLD_MS) continue;
            const now = Date.now();
            if (now - lastLagReportRef.current < LAG_COOLDOWN_MS) continue;
            lastLagReportRef.current = now;
            lagRef.current += 1;
            recordConnectivitySignal('lag', {
              appMode,
              sessionId,
              durationMs: Math.round(entry.duration),
            });
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch {
        /* longtask not supported */
      }
    }

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onActivity, true);
      document.removeEventListener('scroll', onActivity, true);
      document.removeEventListener('touchstart', onActivity, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      clearInterval(tick);
      clearInterval(clickFlush);
      longTaskObserver?.disconnect();
      flushClicks();
    };
  }, [enabled, appMode, sessionId, markActivity, flushClicks]);

  return { getSnapshot, flushClicks };
}
