import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import Anthropic from '@anthropic-ai/sdk'
import { ARIA_SYSTEM_PROMPT } from './prompts/ariaSystem'
import type { ChatWithAriaRequest, ChatWithAriaResponse } from './types'

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')
const MAX_HISTORY = 20

export const chatWithAria = onCall(
  { secrets: [anthropicApiKey], timeoutSeconds: 60, memory: '512MiB' },
  async (request: CallableRequest<ChatWithAriaRequest>): Promise<ChatWithAriaResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.')
    }

    const { message, sessionId, history = [] } = request.data

    if (!message?.trim()) {
      throw new HttpsError('invalid-argument', 'Message is required.')
    }
    if (!sessionId?.trim()) {
      throw new HttpsError('invalid-argument', 'Session ID is required.')
    }

    const userId = request.auth.uid
    const db = admin.firestore()
    const now = admin.firestore.Timestamp.now()

    const trimmedHistory = history.slice(-MAX_HISTORY)
    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...trimmedHistory,
      { role: 'user', content: message },
    ]

    const apiKey = anthropicApiKey.value()
    if (!apiKey) {
      throw new HttpsError('internal', 'AI service not configured.')
    }

    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: ARIA_SYSTEM_PROMPT,
      messages: claudeMessages,
    })

    const reply = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const batch = db.batch()
    const sessionRef = db.collection('users').doc(userId).collection('chatSessions').doc(sessionId)
    const messagesRef = sessionRef.collection('messages')

    const userMsgRef = messagesRef.doc()
    batch.set(userMsgRef, {
      role: 'user',
      content: message,
      timestamp: now,
      sessionId,
      userId,
    })

    const ariaMsgRef = messagesRef.doc()
    batch.set(ariaMsgRef, {
      role: 'assistant',
      content: reply,
      timestamp: admin.firestore.Timestamp.fromMillis(now.toMillis() + 1),
      sessionId,
      userId,
    })

    batch.set(
      sessionRef,
      {
        userId,
        updatedAt: now,
        lastMessage: reply.slice(0, 120),
        messageCount: admin.firestore.FieldValue.increment(2),
      },
      { merge: true }
    )

    await batch.commit()

    return { reply, sessionId, messageId: ariaMsgRef.id }
  }
)
