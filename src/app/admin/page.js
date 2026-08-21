'use client';
import dynamic from 'next/dynamic';

const ScoraApp = dynamic(() => import('../ScoraApp'), { ssr: false });

export default function AdminRoutePage() {
  return <ScoraApp initialView="ADMIN_LOGIN" initialAdminPortal />;
}
