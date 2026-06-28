import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { ActivityLog } from './types'

/** Subscribe to the latest N activity logs for a user. Requires composite index on (userId, timestamp). */
export function subscribeToActivityLogs(
  userId: string,
  maxItems: number,
  onLogs: (logs: ActivityLog[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'activityLogs'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(maxItems)
  )
  return onSnapshot(
    q,
    (snap) => {
      onLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog)))
    },
    onError
  )
}
