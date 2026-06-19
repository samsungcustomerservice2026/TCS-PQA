'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SCORA_CHALLENGE_ADMIN_TAB } from '../../../constants/scoraChallengePaths';

export default function AdminScoraChallengeEntryPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/?portal=admin&tab=${SCORA_CHALLENGE_ADMIN_TAB}`);
  }, [router]);
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
      Loading SCORA Challenge…
    </div>
  );
}
