import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import type { Reminder, ActionCallResult, ReminderRecurrence } from './types'

const executeActionFn = httpsCallable<
  { toolName: string; args: Record<string, unknown> },
  ActionCallResult
>(functions, 'executeAction')

/** Subscribe to all reminders for a user, ordered by scheduled time ascending. */
export function subscribeToReminders(
  userId: string,
  onReminders: (reminders: Reminder[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', userId, 'reminders'),
    orderBy('scheduledAt', 'asc')
  )
  return onSnapshot(
    q,
    (snap) => {
      onReminders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reminder)))
    },
    onError
  )
}

export async function createReminder(args: {
  title: string
  scheduledAt: string
  recurrence?: ReminderRecurrence
  notes?: string
}): Promise<void> {
  const result = await executeActionFn({ toolName: 'createReminder', args })
  if (!result.data.success) throw new Error(result.data.message)
}

export async function deleteReminder(reminderId: string): Promise<void> {
  const result = await executeActionFn({ toolName: 'deleteReminder', args: { reminderId } })
  if (!result.data.success) throw new Error(result.data.message)
}
