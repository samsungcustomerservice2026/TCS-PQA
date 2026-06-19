import { redirect } from 'next/navigation';

import { SCORA_CHALLENGE_PATHS } from '../../constants/scoraChallengePaths';

export default function JoinShortcutPage() {
  redirect(SCORA_CHALLENGE_PATHS.join);
}
