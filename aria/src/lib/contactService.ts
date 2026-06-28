import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import type { Contact, ActionCallResult } from './types'

const executeActionFn = httpsCallable<
  { toolName: string; args: Record<string, unknown> },
  ActionCallResult
>(functions, 'executeAction')

export function subscribeToContacts(
  userId: string,
  onContacts: (contacts: Contact[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', userId, 'contacts'),
    orderBy('name', 'asc')
  )
  return onSnapshot(
    q,
    (snap) => { onContacts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contact))) },
    onError
  )
}

export async function createContact(args: {
  name: string
  phone?: string
  email?: string
  role?: string
  organization?: string
  relationshipType?: string
  relationshipNotes?: string
  tags?: string[]
  preferredContactMethod?: Contact['preferredContactMethod']
}): Promise<void> {
  const result = await executeActionFn({ toolName: 'createContact', args })
  if (!result.data.success) throw new Error(result.data.message)
}

export async function updateContact(args: {
  contactId: string
  name?: string
  phone?: string | null
  email?: string | null
  role?: string | null
  organization?: string | null
  relationshipType?: string | null
  relationshipNotes?: string | null
  tags?: string[]
  preferredContactMethod?: Contact['preferredContactMethod']
}): Promise<void> {
  const result = await executeActionFn({ toolName: 'updateContact', args })
  if (!result.data.success) throw new Error(result.data.message)
}

export async function deleteContact(contactId: string): Promise<void> {
  const result = await executeActionFn({ toolName: 'deleteContact', args: { contactId } })
  if (!result.data.success) throw new Error(result.data.message)
}

export async function addRelationshipNote(args: {
  contactId: string
  note: string
  importance?: 'low' | 'normal' | 'high'
}): Promise<void> {
  const result = await executeActionFn({ toolName: 'addRelationshipNote', args: { ...args, source: 'manual' } })
  if (!result.data.success) throw new Error(result.data.message)
}
