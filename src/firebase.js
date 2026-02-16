import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);
