import type { Timestamp } from 'firebase-admin/firestore'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Timestamp
  sessionId: string
  userId: string
}

export interface ChatSession {
  id: string
  userId: string
  title: string
  createdAt: Timestamp
  updatedAt: Timestamp
  messageCount: number
  lastMessage?: string
}

export interface ChatWithAriaRequest {
  message: string
  sessionId: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface ActionMetadata {
  name: string
  success: boolean
  actionId: string
  message: string
}

export interface ChatWithAriaResponse {
  reply: string
  sessionId: string
  messageId: string
  actionResults?: ActionMetadata[]
}

export interface TranscribeAudioRequest {
  audioBase64: string
  mimeType: string
  languageCode?: string
}

export interface TranscribeAudioResponse {
  transcript: string
  confidence?: number
}

export interface SynthesizeSpeechRequest {
  text: string
  voiceId?: string
}

export interface SynthesizeSpeechResponse {
  audioBase64: string
  mimeType: string
}
