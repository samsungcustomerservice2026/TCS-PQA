'use client';
import dynamic from 'next/dynamic';

const ScoraApp = dynamic(() => import('../ScoraApp'), { ssr: false });

export default function EmployeeRoutePage() {
  return <ScoraApp initialView="EMPLOYEE_DASHBOARD" />;
}
