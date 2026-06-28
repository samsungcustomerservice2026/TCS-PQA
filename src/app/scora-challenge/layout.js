export const metadata = {
  title: 'SCORA Challenge',
  description: 'Join and play SCORA Challenge live games.',
};

export default function ScoraChallengeLayout({ children }) {
  return (
    <div className="mobile-page-shell min-h-dvh bg-black text-white">
      {children}
    </div>
  );
}
