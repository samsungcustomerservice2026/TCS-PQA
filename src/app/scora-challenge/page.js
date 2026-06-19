import { redirect } from 'next/navigation';
import { SCORA_CHALLENGE_PATHS } from '../../constants/scoraChallengePaths';

export default function ScoraChallengeRootPage() {
  redirect(SCORA_CHALLENGE_PATHS.join);
}
