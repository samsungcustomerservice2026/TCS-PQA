'use client';
import dynamic from 'next/dynamic';

const ScoraApp = dynamic(() => import('../ScoraApp'), { ssr: false });

export default function TcsRoutePage() {
  return <ScoraApp initialView="TCS_DIVISION_SELECTION" />;
}
