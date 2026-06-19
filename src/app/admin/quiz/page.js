'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Admin subdomain shortcut → Quiz control panel */
export default function AdminQuizEntryPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/?portal=admin&tab=quiz');
  }, [router]);
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
      Loading SCORA Challenge…
    </div>
  );
}
