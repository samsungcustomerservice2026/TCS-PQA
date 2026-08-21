'use client';
import dynamic from 'next/dynamic';

const ScoraApp = dynamic(() => import('../../ScoraApp'), { ssr: false });

export default function AdminUsersPage() {
  return <ScoraApp initialView="ADMIN_DASHBOARD" initialAdminPortal />;
}
