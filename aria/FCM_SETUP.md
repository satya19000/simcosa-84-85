# FCM Push Notification Setup

## 1. Generate VAPID Key

In Firebase Console → Project Settings → Cloud Messaging → Web Push Certificates → Generate key pair.

Copy the key pair public key.

## 2. Add to Environment

```
VITE_FIREBASE_VAPID_KEY=<your_vapid_public_key>
```

Add to `.env.local` for development and set as an environment variable for production hosting.

## 3. Configure Service Worker

Edit `public/firebase-messaging-sw.js` and replace the placeholder config values with your Firebase project's public config:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
}
```

These are **public** config values — they are safe to include in the service worker. Do **not** include the VAPID private key here.

## 4. Deploy Cloud Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions:processDueReminders,functions:sendTestNotification
```

## 5. Deploy Firestore Index

The scheduled function requires a COLLECTION_GROUP index on `reminders`:

```bash
firebase deploy --only firestore:indexes
```

## 6. Scheduled Function

`processDueReminders` runs every 5 minutes. It queries all reminders across all users where:
- `notified == false`
- `completed == false`
- `scheduledAt <= now`

It sends a push notification to each user's registered FCM tokens, then marks `notified: true`.

For recurring reminders (`daily`, `weekly`, `monthly`), it advances `scheduledAt` to the next occurrence and resets `notified: false`.

## 7. Testing

1. Go to Profile → Notifications section
2. Click **Enable** to request permission and register the FCM token
3. Click **Send Test Notification** to verify the pipeline works

## Notes

- Tokens are stored at `users/{userId}/notificationTokens/{tokenSlice}` where `tokenSlice` is the last 20 characters of the token (used as the document ID for deduplication).
- If `VITE_FIREBASE_VAPID_KEY` is not set, token registration is skipped silently with a warning.
- Notifications in the foreground are handled by `setupForegroundMessageHandler` in `notificationService.ts`.
- Background notifications are handled by the service worker (`public/firebase-messaging-sw.js`).
