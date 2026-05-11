import { redirect } from 'next/navigation';

export default function AdminPortalEntryPage({ searchParams }) {
  const qp = new URLSearchParams();
  qp.set('portal', 'admin');
  const logs = searchParams?.logs;
  if (logs) qp.set('logs', String(logs));
  redirect(`/?${qp.toString()}`);
}
