import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import type { Task, ActionCallResult, TaskPriority } from './types'

const executeActionFn = httpsCallable<
  { toolName: string; args: Record<string, unknown> },
  ActionCallResult
>(functions, 'executeAction')

/** Subscribe to all tasks for a user, ordered by creation date descending. */
export function subscribeToTasks(
  userId: string,
  onTasks: (tasks: Task[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', userId, 'tasks'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(
    q,
    (snap) => {
      onTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)))
    },
    onError
  )
}

export async function createTask(args: {
  title: string
  priority?: TaskPriority
  dueAt?: string
  category?: string
  notes?: string
}): Promise<void> {
  const result = await executeActionFn({ toolName: 'createTask', args })
  if (!result.data.success) throw new Error(result.data.message)
}

export async function completeTask(taskId: string): Promise<void> {
  const result = await executeActionFn({ toolName: 'completeTask', args: { taskId } })
  if (!result.data.success) throw new Error(result.data.message)
}

export async function deleteTask(taskId: string): Promise<void> {
  const result = await executeActionFn({ toolName: 'deleteTask', args: { taskId } })
  if (!result.data.success) throw new Error(result.data.message)
}

export async function updateTask(args: {
  taskId: string
  title?: string
  notes?: string | null
  category?: string | null
  priority?: TaskPriority
  dueAt?: string | null
}): Promise<void> {
  const result = await executeActionFn({ toolName: 'updateTask', args })
  if (!result.data.success) throw new Error(result.data.message)
}
