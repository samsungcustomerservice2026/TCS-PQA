import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore, enableNetwork } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCeD7Xrt6kwPWVgjNIrpwy0jnI8yQso1iM",
    authDomain: "tcs-for-engineers.firebaseapp.com",
    projectId: "tcs-for-engineers",
    storageBucket: "tcs-for-engineers.firebasestorage.app",
    messagingSenderId: "283193216884",
    appId: "1:283193216884:web:75df672769338634722621"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Optional App Check (reCAPTCHA v3). Set NEXT_PUBLIC_FIREBASE_APPCHECK_KEY and enable App Check in Firebase Console.
let appCheckInitialized = false;
if (typeof window !== "undefined" && !appCheckInitialized) {
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

// Force long-polling: WebChannel streams often fail behind VPN / antivirus / corporate proxies,
// which surfaces as "Could not reach Cloud Firestore backend" + offline getDoc errors.
// Do not combine with experimentalAutoDetectLongPolling (SDK rejects both together).
function createFirestore() {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
}

export const db = createFirestore();

// When the browser comes back online, nudge Firestore out of offline mode.
if (typeof window !== "undefined") {
  const resume = () => {
    enableNetwork(db).catch(() => {});
  };
  window.addEventListener("online", resume);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine !== false) resume();
  });
}

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);
