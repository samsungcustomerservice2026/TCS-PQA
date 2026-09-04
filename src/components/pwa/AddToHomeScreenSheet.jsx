'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import {
  PWA_CAN_INSTALL_EVENT,
  PWA_INSTALLED_EVENT,
  canNativeInstall,
  dismissInstallAsk,
  isIosPhone,
  promptInstall,
  shouldAskInstall,
} from '../../lib/pwa/installHelpers';

/**
 * One-time Add to Home Screen bottom sheet for SCORA.
 */
export default function AddToHomeScreenSheet({
  ready = false,
  blocked = false,
  onVisibleChange,
  onToast,
}) {
  const [open, setOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const ios = typeof window !== 'undefined' ? isIosPhone() : false;

  useEffect(() => {
    setCanInstall(canNativeInstall());
    const onCan = () => setCanInstall(true);
    const onInstalled = () => {
      setOpen(false);
      onVisibleChange?.(false);
      onToast?.('SCORA is on your home screen.');
    };
    window.addEventListener(PWA_CAN_INSTALL_EVENT, onCan);
    window.addEventListener(PWA_INSTALLED_EVENT, onInstalled);
    return () => {
      window.removeEventListener(PWA_CAN_INSTALL_EVENT, onCan);
      window.removeEventListener(PWA_INSTALLED_EVENT, onInstalled);
    };
  }, [onToast, onVisibleChange]);

  useEffect(() => {
    if (!ready || blocked || !shouldAskInstall()) {
      setOpen(false);
      onVisibleChange?.(false);
      return undefined;
    }
    const t = window.setTimeout(() => {
      if (!shouldAskInstall()) return;
      setOpen(true);
      onVisibleChange?.(true);
    }, 700);
    return () => window.clearTimeout(t);
  }, [ready, blocked, onVisibleChange]);

  const closeForever = useCallback(() => {
    dismissInstallAsk();
    setOpen(false);
    onVisibleChange?.(false);
  }, [onVisibleChange]);

  const handlePrimary = useCallback(async () => {
    if (ios) {
      closeForever();
      return;
    }
    if (canInstall) {
      const result = await promptInstall();
      if (result === 'accepted') {
        closeForever();
        onToast?.('SCORA added to your home screen.');
        return;
      }
      if (result === 'unavailable') {
        onToast?.('From the browser menu: Add to Home screen.');
      }
      // Native sheet dismissed — keep ask until explicit Later
      return;
    }
    onToast?.('From the browser menu: Add to Home screen.');
    closeForever();
  }, [canInstall, closeForever, ios, onToast]);

  if (!open) return null;

  const primaryLabel = ios
    ? 'Got it'
    : canInstall
      ? 'Add to home screen'
      : 'Got it';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scora-install-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Dismiss"
        onClick={closeForever}
      />
      <div
        className="relative w-full max-w-lg rounded-t-[1.75rem] border border-white/10 bg-zinc-950 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(37,99,235,0.25)]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" aria-hidden />
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-600/20">
            <Smartphone className="h-6 w-6 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <h2 id="scora-install-title" className="text-base font-black uppercase tracking-tight text-white">
              Add SCORA to your home screen
            </h2>
            <p className="text-[11px] font-medium leading-relaxed text-zinc-400">
              Open SCORA like a real app — faster access to TCS, PQA, Challenge, and GoGo. Alerts can reach you even if the phone is locked or you are in another app.
            </p>
            {ios ? (
              <p className="flex items-start gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-[10px] font-semibold leading-relaxed text-zinc-300">
                <Share className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                In Safari: tap Share → Add to Home Screen, then open SCORA from the icon.
              </p>
            ) : !canInstall ? (
              <p className="rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-[10px] font-semibold leading-relaxed text-zinc-300">
                From the browser menu: Add to Home screen.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={closeForever}
            className="rounded-full border border-white/10 p-1.5 text-zinc-500 transition hover:border-white/25 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={handlePrimary}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-[0_0_24px_rgba(37,99,235,0.45)] transition hover:bg-blue-500 active:scale-[0.98]"
          >
            {!ios && canInstall ? <Download className="h-4 w-4" /> : null}
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={closeForever}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
