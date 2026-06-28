import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getMessaging, type Messaging, isSupported } from 'firebase/messaging'
import { getFunctions, type Functions } from 'firebase/functions'
import { getAnalytics, type Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0]

export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)
export const functions: Functions = getFunctions(app)

let analytics: Analytics | null = null
let messaging: Messaging | null = null

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
    }
  })
}

export { analytics, messaging }
export default app
