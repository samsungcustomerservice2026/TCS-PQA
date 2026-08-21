'use client';
import dynamic from 'next/dynamic';

const ScoraApp = dynamic(() => import('../ScoraApp'), { ssr: false });

export default function ConsultantsRoutePage() {
  return <ScoraApp initialView="CONSULTANT_VIEWER" />;
}
