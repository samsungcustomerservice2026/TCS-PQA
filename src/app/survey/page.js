'use client';
import dynamic from 'next/dynamic';

const ScoraApp = dynamic(() => import('../ScoraApp'), { ssr: false });

export default function SurveyRoutePage() {
  return <ScoraApp initialView="SAMSUNG_ACADEMY_SURVEY" />;
}
