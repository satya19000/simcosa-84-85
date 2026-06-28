import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import type { ChatMessage, ChatWithAriaRequest, ChatWithAriaResponse } from './types'

const chatWithAriaFn = httpsCallable<ChatWithAriaRequest, ChatWithAriaResponse>(
  functions,
  'chatWithAria'
)

/** Ensure a chat session doc exists. */
export async function ensureChatSession(userId: string, sessionId: string): Promise<void> {
  const sessionRef = doc(db, 'users', userId, 'chatSessions', sessionId)
  await setDoc(
    sessionRef,
    {
      userId,
      title: 'New Conversation',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
    },
    { merge: true }
  )
}

/** Send a message to ARIA via Cloud Function. */
export async function sendMessageToAria(
  message: string,
  sessionId: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ChatWithAriaResponse> {
  const result = await chatWithAriaFn({ message, sessionId, history })
  return result.data
}

/** Subscribe to real-time messages in a session. */
export function subscribeToMessages(
  userId: string,
  sessionId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const messagesRef = collection(
    db,
    'users',
    userId,
    'chatSessions',
    sessionId,
    'messages'
  )
  const q = query(messagesRef, orderBy('timestamp', 'asc'))

  return onSnapshot(
    q,
    (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, 'id'>),
      }))
      onMessages(msgs)
    },
    onError
  )
}
