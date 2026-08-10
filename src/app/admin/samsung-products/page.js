'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Shortcut URL → admin portal Samsung KB tab. */
export default function AdminSamsungProductsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/?portal=admin&tab=samsung-kb');
  }, [router]);
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
      Opening Samsung KB…
    </div>
  );
}
