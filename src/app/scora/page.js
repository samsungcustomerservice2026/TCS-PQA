import { redirect } from 'next/navigation';

/** SCORA Challenge lives under /scora-challenge — keep /scora as entry alias. */
export default function ScoraAliasPage() {
  redirect('/scora-challenge/join');
}
