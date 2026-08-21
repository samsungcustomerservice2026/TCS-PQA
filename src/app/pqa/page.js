'use client';
import dynamic from 'next/dynamic';

const ScoraApp = dynamic(() => import('../ScoraApp'), { ssr: false });

export default function PqaRoutePage() {
  return <ScoraApp initialView="PQA_DIVISION_SELECTION" />;
}
