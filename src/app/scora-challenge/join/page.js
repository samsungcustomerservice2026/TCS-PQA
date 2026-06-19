import { Suspense } from 'react';
import ScoraChallengeJoinView from '../../../components/quiz/ScoraChallengeJoinView';

export const metadata = {
  title: 'Join SCORA Challenge',
  description: 'Enter your game code and nickname to join a SCORA Challenge live game.',
};

export default function ScoraChallengeJoinPage() {
  return (
    <Suspense fallback={(
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-4xl font-black text-white">SCORA Challenge</p>
        <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">Loading…</p>
      </div>
    )}
    >
      <ScoraChallengeJoinView />
    </Suspense>
  );
}
