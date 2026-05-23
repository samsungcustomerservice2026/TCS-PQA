'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/** Client redirect avoids server redirect loops with Turbopack dev reloads. */
export default function AdminPortalEntryPage() {
  const router = useRouter();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;
    const qp = new URLSearchParams(window.location.search);
    qp.set('portal', 'admin');
    router.replace(`/?${qp.toString()}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
      Loading admin portal…
    </div>
  );
}
