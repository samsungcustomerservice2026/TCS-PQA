'use client';

import { useEffect } from 'react';
import { listenInstallPrompt, registerNotifyWorker, notifyPermission, syncPushSubscription } from '../../lib/pwa/installHelpers';

/**
 * Mount once at app root — captures beforeinstallprompt before any popup mounts,
 * registers the service worker, and re-syncs push if already granted.
 */
export default function PwaBoot({ userId = null }) {
  useEffect(() => {
    const unlisten = listenInstallPrompt();
    let cancelled = false;

    (async () => {
      await registerNotifyWorker();
      if (cancelled) return;
      if (notifyPermission() === 'granted') {
        await syncPushSubscription(userId);
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [userId]);

  return null;
}
