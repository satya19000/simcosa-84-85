import { httpsCallable } from 'firebase/functions'
import { collection, query, orderBy, limit, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { functions, db } from './firebase'
import type { Briefing } from './types'

const generateDailyBriefingFn = httpsCallable<{ timezone?: string }, {
  briefingId: string
  summary: string
  sections: Array<{ heading: string; body: string }>
  generatedAt: string
}>(functions, 'generateDailyBriefing')

export async function generateDailyBriefing(timezone?: string): Promise<Briefing> {
  const result = await generateDailyBriefingFn({ timezone })
  return result.data as Briefing
}

export function subscribeLatestBriefing(
  userId: string,
  onBriefing: (briefing: Briefing | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const ref = collection(db, 'users', userId, 'briefings')
  const q = query(ref, orderBy('generatedAt', 'desc'), limit(1))

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onBriefing(null)
      } else {
        onBriefing({ id: snap.docs[0].id, ...snap.docs[0].data() } as unknown as Briefing)
      }
    },
    (err) => onError?.(err)
  )
}
