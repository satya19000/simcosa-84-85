import type { Timestamp } from 'firebase/firestore'

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
