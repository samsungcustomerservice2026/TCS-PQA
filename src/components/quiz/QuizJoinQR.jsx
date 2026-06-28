'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { Copy } from 'lucide-react';
import { scoraChallengeJoinUrl } from '../../constants/scoraChallengePaths';
import { SCORA_CHALLENGE_JOIN_URL } from '../../constants/scoraDomains';

export default function QuizJoinQR({
  url,
  pin,
  title = 'Scan to join',
  subtitle,
  size = 200,
  className = '',
}) {
  const joinUrl = url || (
    typeof window !== 'undefined'
      ? scoraChallengeJoinUrl(pin, window.location.origin)
      : (pin ? `${SCORA_CHALLENGE_JOIN_URL}?pin=${encodeURIComponent(pin)}` : SCORA_CHALLENGE_JOIN_URL)
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch { /* ignore */ }
  };

  return (
    <div className={`flex flex-col items-center text-center space-y-4 w-full min-w-0 max-w-sm mx-auto shrink-0 ${className}`}>
      <div className="w-full min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-400">{title}</p>
        {subtitle && <p className="text-[11px] text-zinc-500 mt-1 max-w-xs mx-auto">{subtitle}</p>}
      </div>
      <div className="p-3 sm:p-4 rounded-2xl bg-white shadow-lg shadow-black/40 ring-4 ring-white/10 w-full max-w-[min(100%,220px)]">
        <QRCode value={joinUrl} size={size} level="M" className="w-full h-auto max-w-full" />
      </div>
      {pin && (
        <p className="text-2xl sm:text-3xl font-black text-blue-400 tracking-[0.25em] sm:tracking-[0.3em]">{pin}</p>
      )}
      <p className="text-[10px] font-mono text-zinc-500 break-all max-w-full px-2">{joinUrl}</p>
      <button
        type="button"
        onClick={copyLink}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-[10px] font-black uppercase text-zinc-400 hover:text-white"
      >
        <Copy className="w-3.5 h-3.5" /> Copy link
      </button>
    </div>
  );
}

export function getQuizJoinUrl(pin, baseUrl) {
  return scoraChallengeJoinUrl(pin, baseUrl);
}
