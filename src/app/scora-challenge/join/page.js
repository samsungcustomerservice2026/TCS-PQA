import { Suspense } from 'react';
import ScoraChallengeJoinView from '../../../components/quiz/ScoraChallengeJoinView';

export const metadata = {
  title: 'Join SCORA Challenge',
  description: 'Enter your game code and nickname to join a SCORA Challenge live game.',
};

export default function ScoraChallengeJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">SCORA Challenge…</div>}>
      <ScoraChallengeJoinView />
    </Suspense>
  );
}
