'use client';
import dynamic from 'next/dynamic';

const ScoraApp = dynamic(() => import('../../ScoraApp'), { ssr: false });

export default function AdminAuditPage() {
  return <ScoraApp initialView="EXTERNAL_LOGS" initialAdminPortal />;
}
