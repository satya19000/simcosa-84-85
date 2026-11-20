import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

// Firebase web configuration identifies the project; it is not a secret.
// Provider API keys (speech, AI) live only on the backend.
const env = import.meta.env;
const useEmulators = env.VITE_USE_EMULATORS === "true";

export const firebaseConfigured = Boolean(env.VITE_FIREBASE_PROJECT_ID);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || "demo-meetbrief",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "demo-meetbrief.appspot.com",
  appId: env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);
// Offline cache lets the app show meetings and queue metadata writes during brief network loss.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const storage = getStorage(app);

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8085);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}

export const API_BASE = (env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
export const usingEmulators = useEmulators;
