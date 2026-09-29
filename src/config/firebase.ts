import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJ1oda9FePj90ktJss6Zye_TbnE7BDVDI",
  authDomain: "collage-28e7c.firebaseapp.com",
  projectId: "collage-28e7c",
  storageBucket: "collage-28e7c.firebasestorage.app",
  messagingSenderId: "582250594079",
  appId: "1:582250594079:web:e5c9a7838a64b11f617a2a",
  measurementId: "G-7MSWVENWSR",
};

// Initialize Firebase safely
let app: any;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (err) {
  console.warn("Firebase initializeApp warning:", err);
  app = getApps().length > 0 ? getApp() : null;
}

// Initialize Analytics asynchronously and safely (never throw on module load)
export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn("Firebase Analytics not supported or blocked:", err);
    });
}

// Initialize Firebase Authentication
let authInstance: any = null;
try {
  if (app) {
    authInstance = getAuth(app);
  }
} catch (e) {
  console.warn("Firebase getAuth error:", e);
}

// Initialize Cloud Firestore Database with long polling to ensure reliability in iframes and proxies
let firestoreInstance: any = null;
try {
  if (app) {
    firestoreInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  }
} catch (e) {
  try {
    firestoreInstance = getFirestore(app);
  } catch (err) {
    console.warn("Firebase getFirestore error:", err);
  }
}

export const auth = authInstance;
export const db = firestoreInstance;
export default app;
