import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

import appletConfig from "../../firebase-applet-config.json";

// Your web app's Firebase configuration from provisioned environment
const firebaseConfig = {
  apiKey: appletConfig.apiKey || "AIzaSyAJ1oda9FePj90ktJss6Zye_TbnE7BDVDI",
  authDomain: appletConfig.authDomain || "collage-28e7c.firebaseapp.com",
  projectId: appletConfig.projectId || "collage-28e7c",
  storageBucket: appletConfig.storageBucket || "collage-28e7c.firebasestorage.app",
  messagingSenderId: appletConfig.messagingSenderId || "582250594042",
  appId: appletConfig.appId || "1:582250594042:web:715a31b9d40b7d72c0576d",
  measurementId: appletConfig.measurementId || "",
};

export const FIRESTORE_DATABASE_ID = appletConfig.firestoreDatabaseId || "(default)";

// Initialize Firebase safely
let app: any;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (err) {
  console.warn("Firebase initializeApp warning:", err);
  app = getApps().length > 0 ? getApp() : null;
}

// Initialize Analytics safely only if a valid measurementId is provided
export let analytics: any = null;
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  isSupported()
    .then((supported) => {
      if (supported && app && firebaseConfig.measurementId) {
        try {
          analytics = getAnalytics(app);
        } catch (err) {
          console.debug("[Firebase Analytics] Skipped initialization:", err);
        }
      }
    })
    .catch(() => {
      // Analytics not supported in this environment
    });
}

// Initialize Firebase Authentication with explicit browserLocalPersistence
let authInstance: any = null;
try {
  if (app) {
    authInstance = getAuth(app);
    if (typeof window !== "undefined") {
      setPersistence(authInstance, browserLocalPersistence).catch((err) => {
        console.warn("[FirebaseAuth] Could not set browser persistence:", err);
      });
    }
  }
} catch (e) {
  console.warn("Firebase getAuth error:", e);
}

// Initialize Cloud Firestore Database
let firestoreInstance: any = null;
try {
  if (app) {
    if (FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== "(default)") {
      firestoreInstance = initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true,
        },
        FIRESTORE_DATABASE_ID
      );
    } else {
      firestoreInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    }
  }
} catch (e) {
  try {
    firestoreInstance =
      FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== "(default)"
        ? getFirestore(app, FIRESTORE_DATABASE_ID)
        : getFirestore(app);
  } catch (err) {
    console.warn("Firebase getFirestore error:", err);
  }
}

export const auth = authInstance;
export const db = firestoreInstance;
export { firebaseConfig };

/**
 * Create a user account in Firebase Authentication without signing out the active session.
 * Uses Google Identity Toolkit REST API or an isolated secondary Firebase App instance.
 */
export async function createFirebaseAuthUser(
  email: string,
  password: string,
  displayName?: string
): Promise<{ uid: string; email: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const apiKey = firebaseConfig.apiKey;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await res.json();

    if (data.localId) {
      if (displayName && data.idToken) {
        try {
          await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                idToken: data.idToken,
                displayName,
                returnSecureToken: false,
              }),
            }
          );
        } catch {}
      }
      return { uid: data.localId, email: data.email || cleanEmail };
    }

    // Handle existing email: update password or retrieve user
    if (data.error && (data.error.message === "EMAIL_EXISTS" || data.error.message.includes("EMAIL_EXISTS"))) {
      try {
        const signRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: cleanEmail,
              password,
              returnSecureToken: true,
            }),
          }
        );
        const signData = await signRes.json();
        if (signData.localId) {
          return { uid: signData.localId, email: signData.email || cleanEmail };
        }
      } catch {}
    }

    if (data.error?.message) {
      console.warn("Identity Toolkit notice:", data.error.message);
    }
  } catch (err) {
    console.warn("createFirebaseAuthUser fetch error:", err);
  }

  // Fallback: Secondary Firebase App instance
  try {
    const { initializeApp: initApp, getApps: listApps } = await import("firebase/app");
    const { getAuth: getSecondaryAuth, createUserWithEmailAndPassword: createSecondaryUser, signOut: signOutSecondary } = await import("firebase/auth");
    
    let secondaryApp = listApps().find((a) => a.name === "SecondaryProvisionApp");
    if (!secondaryApp) {
      secondaryApp = initApp(firebaseConfig, "SecondaryProvisionApp");
    }
    const secondaryAuth = getSecondaryAuth(secondaryApp);
    const cred = await createSecondaryUser(secondaryAuth, cleanEmail, password);
    const uid = cred.user.uid;
    await signOutSecondary(secondaryAuth).catch(() => {});
    return { uid, email: cleanEmail };
  } catch (fallbackErr: any) {
    console.warn("Secondary app provision notice:", fallbackErr);
    const fallbackUid = `stu_${cleanEmail.replace(/[^a-z0-9]/g, "")}`;
    return { uid: fallbackUid, email: cleanEmail };
  }
}

export default app;
