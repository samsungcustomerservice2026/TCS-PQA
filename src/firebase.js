import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);
