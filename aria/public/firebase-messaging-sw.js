// Firebase Messaging Service Worker
// This file must be at /firebase-messaging-sw.js (public root).
// Replace the firebaseConfig values with your project's config.
// IMPORTANT: Do not put secret keys here. Only use public config values.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// TODO: Replace with your Firebase project config (public values only)
const firebaseConfig = {
  apiKey: self.__FIREBASE_API_KEY__ || '',
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || '',
  projectId: self.__FIREBASE_PROJECT_ID__ || '',
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || '',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || '',
  appId: self.__FIREBASE_APP_ID__ || '',
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'ARIA'
  const body = payload.notification?.body ?? ''
  const icon = payload.notification?.icon ?? '/icons/icon-192.png'
  const badge = '/icons/icon-72.png'
  const tag = payload.data?.reminderId ? `reminder-${payload.data.reminderId}` : 'aria-notification'

  self.registration.showNotification(title, {
    body,
    icon,
    badge,
    tag,
    data: payload.data ?? {},
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})
