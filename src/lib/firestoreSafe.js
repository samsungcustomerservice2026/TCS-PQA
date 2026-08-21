import { db, ensureFirestoreNetwork, isFirestorePoisoned, markFirestorePoisoned } from '../firebase';

/** True when Firestore/network reports an offline / unreachable condition. */
export function isFirestoreOfflineError(err) {
  if (markFirestorePoisoned(err) || isFirestorePoisoned()) return true;
  const code = String(err?.code || '');
  const msg = String(err?.message || err || '');
  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    /offline|unavailable|timeout|Could not reach Cloud Firestore|Failed to get document|Backend didn't respond|INTERNAL ASSERTION FAILED/i.test(msg)
  );
}

export function isBrowserOnline() {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine !== false;
}

/**
 * Run a Firestore read/write with one soft retry when offline.
 * Never calls enableNetwork — that can hard-crash firebase@12.9 (ca9/b815).
 */
export async function withFirestoreRetry(fn, { retries = 1 } = {}) {
  if (isFirestorePoisoned()) {
    throw Object.assign(new Error('Firestore client unavailable'), { code: 'unavailable' });
  }

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (attempt > 0) {
        await ensureFirestoreNetwork();
        await new Promise((r) => setTimeout(r, 500));
      }
      return await fn();
    } catch (err) {
      lastErr = err;
      if (markFirestorePoisoned(err)) throw err;
      if (!isFirestoreOfflineError(err) || attempt >= retries || !isBrowserOnline()) {
        throw err;
      }
    }
  }
  throw lastErr;
}

/** Soft read helper — returns fallback on offline OR permission-denied (rules). */
export async function softFirestore(fn, fallback = null) {
  if (!isBrowserOnline() || isFirestorePoisoned()) return fallback;
  try {
    return await withFirestoreRetry(fn, { retries: 1 });
  } catch (err) {
    if (isFirestoreOfflineError(err)) return fallback;
    const code = String(err?.code || '');
    const msg = String(err?.message || '');
    if (
      code === 'permission-denied' ||
      /missing or insufficient permissions/i.test(msg)
    ) {
      console.warn('Firestore permission denied (soft):', msg);
      return fallback;
    }
    throw err;
  }
}
