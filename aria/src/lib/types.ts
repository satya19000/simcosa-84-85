import type { Timestamp } from 'firebase/firestore'

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'
export type ReminderRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Task {
  id: string
  title: string
  priority: TaskPriority
  dueAt: string | null
  category: string | null
  notes: string | null
  completed: boolean
  completedAt?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  title: string
  scheduledAt: string
  recurrence: ReminderRecurrence
  notes: string | null
  completed: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export interface ActivityLog {
  id: string
  actionId: string
  toolName: string
  userId: string
  timestamp: string
  durationMs: number
  success: boolean
  argsSummary: Record<string, unknown>
  errorCode: string | null
  errorDetail: string | null
}

export interface ActionCallResult {
  success: boolean
  message: string
  data: unknown
  error: { code: string; detail: string } | null
  executionTimeMs: number
  actionId: string
}

export interface ActionChip {
  name: string
  success: boolean
  actionId: string
  message: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Timestamp | null
  sessionId: string
  userId: string
  toolUsed?: boolean
  tools?: ActionChip[]
}

export interface ChatSession {
  id: string
  userId: string
  title: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
  messageCount: number
  lastMessage?: string
}

export interface ChatWithAriaRequest {
  message: string
  sessionId: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface ChatWithAriaResponse {
  reply: string
  sessionId: string
  messageId: string
  actionResults?: ActionChip[]
}
