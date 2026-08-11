import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  enableNetwork,
  setLogLevel,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyCeD7Xrt6kwPWVgjNIrpwy0jnI8yQso1iM",
  authDomain: "tcs-for-engineers.firebaseapp.com",
  projectId: "tcs-for-engineers",
  storageBucket: "tcs-for-engineers.firebasestorage.app",
  messagingSenderId: "283193216884",
  appId: "1:283193216884:web:75df672769338634722621",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const isBrowser = typeof window !== "undefined";

// Quiet SDK transport noise in Next.js overlay (still recoverable offline mode).
if (isBrowser) {
  try {
    setLogLevel("error");
  } catch {
    /* ignore */
  }
}

let appCheckInitialized = false;
if (isBrowser && !appCheckInitialized) {
  const appCheckSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_KEY;
  if (appCheckSiteKey) {
    appCheckInitialized = true;
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e) {
      console.warn("Firebase App Check initialization failed:", e);
    }
  }
}

/**
 * Why clients go "offline":
 * Firestore opens a streaming WebChannel to Google. If that channel is blocked
 * (VPN, antivirus, proxy, flaky Wi‑Fi) or does not respond within ~10s, the SDK
 * marks itself offline. Later getDoc/getDocs then fail with
 * "Failed to get document because the client is offline."
 *
 * Mitigations: force long-polling (proxy-friendly), persistent cache, and
 * enableNetwork() retries when the browser is back online.
 */
function createFirestore() {
  const settings = {
    ignoreUndefinedProperties: true,
  };

  if (isBrowser) {
    // Force long-polling — cannot be used in Node; only set in the browser.
    settings.experimentalForceLongPolling = true;
    settings.experimentalLongPollingOptions = {
      // Keep long-poll requests open longer on slow networks (valid range ~5–30).
      timeoutSeconds: 25,
    };
    try {
      settings.localCache = persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      });
    } catch {
      // IndexedDB unavailable (private mode / blocked storage) — memory cache is fine.
    }
  }

  try {
    return initializeFirestore(app, settings);
  } catch {
    return getFirestore(app);
  }
}

export const db = createFirestore();

let reconnectInFlight = null;

/** Nudge Firestore out of offline mode when the browser reports online. */
export async function ensureFirestoreNetwork() {
  if (!isBrowser) return false;
  if (navigator.onLine === false) return false;
  if (reconnectInFlight) return reconnectInFlight;
  reconnectInFlight = enableNetwork(db)
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      reconnectInFlight = null;
    });
  return reconnectInFlight;
}

if (isBrowser) {
  const resume = () => {
    void ensureFirestoreNetwork();
  };
  window.addEventListener("online", resume);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resume();
  });
  // First paint: try to leave offline mode ASAP.
  resume();
}

export const storage = getStorage(app);
