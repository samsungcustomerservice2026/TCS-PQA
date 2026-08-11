import { enableNetwork } from 'firebase/firestore';
import { db, ensureFirestoreNetwork } from '../firebase';

/** True when Firestore/network reports an offline / unreachable condition. */
export function isFirestoreOfflineError(err) {
  const code = String(err?.code || '');
  const msg = String(err?.message || err || '');
  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    /offline|unavailable|timeout|Could not reach Cloud Firestore|Failed to get document|Backend didn't respond/i.test(msg)
  );
}

export function isBrowserOnline() {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine !== false;
}

/**
 * Run a Firestore read/write with one reconnect retry when the client is offline.
 * Avoids throwing "Failed to get document because the client is offline" to the UI
 * when the network recovers a moment later.
 */
export async function withFirestoreRetry(fn, { retries = 1 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (attempt > 0) {
        await ensureFirestoreNetwork();
        // Brief pause so long-polling can reattach before the next getDoc.
        await new Promise((r) => setTimeout(r, 400));
      }
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isFirestoreOfflineError(err) || attempt >= retries || !isBrowserOnline()) {
        throw err;
      }
      try {
        await enableNetwork(db);
      } catch {
        /* ignore */
      }
    }
  }
  throw lastErr;
}

/** Soft read helper — returns null instead of throwing on offline/unreachable. */
export async function softFirestore(fn, fallback = null) {
  if (!isBrowserOnline()) return fallback;
  try {
    return await withFirestoreRetry(fn, { retries: 1 });
  } catch (err) {
    if (isFirestoreOfflineError(err)) return fallback;
    throw err;
  }
}
