import { initializeApp, getApps, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { config, isEmulator } from "./config.js";

if (!getApps().length) {
  initializeApp({
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET ?? `${config.FIREBASE_PROJECT_ID}.appspot.com`,
    // On Cloud Run, Application Default Credentials come from the service account.
    ...(isEmulator ? {} : { credential: applicationDefault() }),
  });
}

export const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
export const auth = getAuth();
export const bucket = getStorage().bucket();

export const nowIso = () => new Date().toISOString();
