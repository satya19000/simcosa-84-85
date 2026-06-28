import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'

export const sendTestNotification = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.')
  const userId = request.auth.uid

  const tokensSnap = await admin.firestore()
    .collection('users').doc(userId)
    .collection('notificationTokens')
    .get()

  if (tokensSnap.empty) {
    throw new HttpsError('not-found', 'No notification tokens registered.')
  }

  const tokens = tokensSnap.docs.map((d) => d.data().token as string).filter(Boolean)
  if (tokens.length === 0) throw new HttpsError('not-found', 'No valid tokens found.')

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: 'ARIA',
      body: 'Notifications are working! 🎉',
    },
    webpush: {
      notification: {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
      },
    },
  }

  const result = await admin.messaging().sendEachForMulticast(message)
  const successCount = result.responses.filter((r) => r.success).length

  return { sent: successCount, total: tokens.length }
})
