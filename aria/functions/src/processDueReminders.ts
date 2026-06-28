import * as admin from 'firebase-admin'
import { onSchedule } from 'firebase-functions/v2/scheduler'

export const processDueReminders = onSchedule('every 5 minutes', async () => {
  const db = admin.firestore()
  const now = new Date()

  // Find reminders that are due, not yet notified, not completed
  const snap = await db.collectionGroup('reminders')
    .where('notified', '==', false)
    .where('completed', '==', false)
    .where('scheduledAt', '<=', now.toISOString())
    .limit(100)
    .get()

  if (snap.empty) return

  const batch = db.batch()
  const byUser: Record<string, Array<{ title: string; reminderId: string }>> = {}

  for (const doc of snap.docs) {
    const data = doc.data() as { userId: string; title: string; scheduledAt: string; recurrence?: string }
    const userId = data.userId

    // Mark notified
    batch.update(doc.ref, { notified: true })

    if (!byUser[userId]) byUser[userId] = []
    byUser[userId].push({ title: data.title, reminderId: doc.id })

    // Advance recurring reminders
    if (data.recurrence && data.recurrence !== 'none') {
      const next = new Date(data.scheduledAt)
      switch (data.recurrence) {
        case 'daily': next.setDate(next.getDate() + 1); break
        case 'weekly': next.setDate(next.getDate() + 7); break
        case 'monthly': next.setMonth(next.getMonth() + 1); break
      }
      batch.update(doc.ref, { scheduledAt: next.toISOString(), notified: false })
    }
  }

  await batch.commit()

  // Send push notifications per user
  for (const [userId, items] of Object.entries(byUser)) {
    const tokensSnap = await db
      .collection('users').doc(userId)
      .collection('notificationTokens')
      .get()

    if (tokensSnap.empty) continue

    const tokens = tokensSnap.docs.map((d) => d.data().token as string).filter(Boolean)
    if (tokens.length === 0) continue

    for (const item of items) {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: 'ARIA Reminder',
          body: item.title,
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            tag: `reminder-${item.reminderId}`,
          },
        },
        data: {
          type: 'reminder',
          reminderId: item.reminderId,
          userId,
        },
      }

      try {
        await admin.messaging().sendEachForMulticast(message)
      } catch {
        // Non-fatal: log and continue
        console.error(`Failed to send notification for reminder ${item.reminderId}`)
      }
    }
  }
})
