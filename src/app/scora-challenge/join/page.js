import { Suspense } from 'react';
import ScoraChallengeJoinView from '../../../components/quiz/ScoraChallengeJoinView';

export const metadata = {
  title: 'Join SCORA Challenge',
  description: 'Enter your game code and nickname to join a SCORA Challenge live game.',
};

export default function ScoraChallengeJoinPage() {
  return (
    <Suspense fallback={(
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-400">SCORA Challenge</p>
        <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest">Loading…</p>
      </div>
    )}
    >
      <ScoraChallengeJoinView />
    </Suspense>
  );
}
