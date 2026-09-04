'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import {
  enablePhoneAlerts,
  isIosPhone,
  isStandaloneApp,
  shouldAskNotify,
  unlockAudioOnce,
} from '../../lib/pwa/installHelpers';

/**
 * Sticky in-app banner for notification permission — not the OS sheet itself.
 */
export default function NotifyAlertsBanner({
  ready = false,
  blocked = false,
  userId = null,
  onToast,
}) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const iosNeedsInstall = typeof window !== 'undefined' && isIosPhone() && !isStandaloneApp();

  useEffect(() => {
    if (!ready || blocked || !shouldAskNotify()) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [ready, blocked]);

  const handleLater = useCallback(() => {
    setVisible(false);
  }, []);

  const handleAllow = useCallback(async () => {
    unlockAudioOnce();
    setBusy(true);
    try {
      const result = await enablePhoneAlerts(userId);
      if (result.status === 'need_homescreen') {
        onToast?.('On iPhone: Share → Add to Home Screen, then open from the icon.');
        return;
      }
      if (result.status === 'granted') {
        setVisible(false);
        onToast?.('Phone alerts enabled for SCORA.');
        return;
      }
      if (result.status === 'denied') {
        setVisible(false);
        onToast?.('Alerts blocked — enable them in browser or phone settings.');
        return;
      }
      onToast?.('This browser blocked the alerts prompt.');
    } finally {
      setBusy(false);
    }
  }, [onToast, userId]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[90] px-3 sm:px-4"
      style={{ top: 'max(0.75rem, calc(env(safe-area-inset-top, 0px) + 4.75rem))' }}
      role="region"
      aria-label="Enable SCORA alerts"
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-lg items-start gap-3 rounded-2xl border border-blue-500/25 bg-zinc-950/95 px-3.5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/20">
          <Bell className="h-4 w-4 text-blue-400" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] font-semibold leading-relaxed text-zinc-200">
            {iosNeedsInstall
              ? 'On iPhone: Share → Add to Home Screen, then enable alerts.'
              : 'Turn on phone alerts — you’ll get them even if the screen is locked or you’re in another app.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onPointerDown={unlockAudioOnce}
              onClick={handleAllow}
              className="rounded-xl bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {iosNeedsInstall ? 'How to install' : 'Enable alerts'}
            </button>
            <button
              type="button"
              onClick={handleLater}
              className="rounded-xl border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition hover:border-white/30 hover:text-white"
            >
              Later
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLater}
          className="rounded-full p-1 text-zinc-500 transition hover:text-white"
          aria-label="Dismiss alerts banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
