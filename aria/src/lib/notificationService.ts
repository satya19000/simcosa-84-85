import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions, getMessagingAsync } from './firebase'
import { useAuthStore } from '@/store/authStore'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported'

export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as NotificationPermissionStatus
}

export async function requestPermissionAndRegister(): Promise<{ success: boolean; message: string }> {
  if (typeof Notification === 'undefined') {
    return { success: false, message: 'Push notifications are not supported in this browser.' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { success: false, message: 'Notification permission denied.' }
  }

  return registerFCMToken()
}

export async function registerFCMToken(): Promise<{ success: boolean; message: string }> {
  try {
    const messaging = await getMessagingAsync()
    if (!messaging) return { success: false, message: 'Firebase Messaging is not supported.' }

    if (!VAPID_KEY) {
      console.warn('VITE_FIREBASE_VAPID_KEY is not set — FCM token registration skipped.')
      return { success: false, message: 'VAPID key not configured.' }
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    })

    const userId = useAuthStore.getState().user?.uid
    if (!userId || !token) return { success: false, message: 'Could not obtain FCM token.' }

    await setDoc(
      doc(db, 'users', userId, 'notificationTokens', token.slice(-20)),
      { token, createdAt: serverTimestamp(), userAgent: navigator.userAgent },
      { merge: true }
    )

    return { success: true, message: 'Notifications enabled.' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, message: msg }
  }
}

export async function unregisterFCMToken(): Promise<void> {
  try {
    const messaging = await getMessagingAsync()
    if (!messaging || !VAPID_KEY) return

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    })

    const userId = useAuthStore.getState().user?.uid
    if (!userId || !token) return

    await deleteDoc(doc(db, 'users', userId, 'notificationTokens', token.slice(-20)))
  } catch {
    // Best-effort
  }
}

export async function sendTestNotification(): Promise<{ success: boolean; message: string }> {
  try {
    const fn = httpsCallable<unknown, { sent: number; total: number }>(functions, 'sendTestNotification')
    const result = await fn({})
    return { success: true, message: `Test notification sent to ${result.data.sent} device(s).` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send test notification'
    return { success: false, message: msg }
  }
}

export async function setupForegroundMessageHandler(
  onNotification: (title: string, body: string) => void
): Promise<() => void> {
  const messaging = await getMessagingAsync()
  if (!messaging) return () => {}

  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? 'ARIA'
    const body = payload.notification?.body ?? ''
    onNotification(title, body)
  })
}
