import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getCommunicationEngine } from './communication'
import type {
  CommunicationMessage,
  ProviderSendOptions,
  CommunicationSearchOptions,
  SummaryType,
  ReplyTone,
  ScheduledMessage,
  CommunicationTemplate,
} from './communication/CommunicationTypes'

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? ''
}

// ── Provider Health ───────────────────────────────────────────────────────────

export const getProviderHealth = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.healthCheckAll(request.auth.uid)
  }
)

export const listCommunicationProviders = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.listProviders()
  }
)

// ── Message Operations ────────────────────────────────────────────────────────

export const ingestCommunicationMessage = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const message = request.data as CommunicationMessage
    if (!message.providerId || !message.body) throw new HttpsError('invalid-argument', 'providerId and body required')
    message.userId = request.auth.uid
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.ingestMessage(request.auth.uid, message)
  }
)

export const sendCommunicationMessage = onCall(
  { timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { providerId, opts } = request.data as { providerId: string; opts: ProviderSendOptions }
    if (!providerId || !opts?.body) throw new HttpsError('invalid-argument', 'providerId and opts.body required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.sendMessage(request.auth.uid, providerId, opts)
  }
)

export const syncCommunicationProvider = onCall(
  { timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { providerId } = request.data as { providerId: string }
    if (!providerId) throw new HttpsError('invalid-argument', 'providerId required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    const count = await engine.syncProvider(request.auth.uid, providerId)
    return { synced: count }
  }
)

// ── Thread Operations ────────────────────────────────────────────────────────

export const listConversationThreads = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { limit, providerType, status } = (request.data ?? {}) as { limit?: number; providerType?: string; status?: string }
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.listThreads(request.auth.uid, { limit, providerType: providerType as never, status })
  }
)

export const getConversationMessages = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { threadId, limit } = request.data as { threadId: string; limit?: number }
    if (!threadId) throw new HttpsError('invalid-argument', 'threadId required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.getMessages(request.auth.uid, threadId, limit)
  }
)

export const markThreadRead = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { threadId } = request.data as { threadId: string }
    if (!threadId) throw new HttpsError('invalid-argument', 'threadId required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    await engine.markRead(request.auth.uid, threadId)
    return { success: true }
  }
)

export const archiveConversationThread = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { threadId } = request.data as { threadId: string }
    if (!threadId) throw new HttpsError('invalid-argument', 'threadId required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    await engine.archiveThread(request.auth.uid, threadId)
    return { success: true }
  }
)

// ── Intelligence ─────────────────────────────────────────────────────────────

export const analyzeConversationThread = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { threadId } = request.data as { threadId: string }
    if (!threadId) throw new HttpsError('invalid-argument', 'threadId required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.analyzeThread(request.auth.uid, threadId)
  }
)

export const generateConversationSummary = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { threadId, type } = request.data as { threadId: string; type?: SummaryType }
    if (!threadId) throw new HttpsError('invalid-argument', 'threadId required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.generateSummary(request.auth.uid, threadId, type)
  }
)

export const generateAIReply = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { messageId, tone } = request.data as { messageId: string; tone: ReplyTone }
    if (!messageId || !tone) throw new HttpsError('invalid-argument', 'messageId and tone required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.generateReply(request.auth.uid, messageId, tone)
  }
)

// ── Search ────────────────────────────────────────────────────────────────────

export const searchCommunications = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = request.data as CommunicationSearchOptions
    if (!opts?.query) throw new HttpsError('invalid-argument', 'query required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.search(request.auth.uid, opts)
  }
)

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getCommunicationStats = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.getStats(request.auth.uid)
  }
)

// ── Templates ─────────────────────────────────────────────────────────────────

export const createCommunicationTemplate = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<CommunicationTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    if (!fields?.name || !fields?.body) throw new HttpsError('invalid-argument', 'name and body required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.createTemplate(request.auth.uid, fields)
  }
)

export const listCommunicationTemplates = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { providerType } = (request.data ?? {}) as { providerType?: string }
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.listTemplates(request.auth.uid, providerType as never)
  }
)

// ── Scheduler ─────────────────────────────────────────────────────────────────

export const scheduleCommunicationMessage = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<ScheduledMessage, 'id' | 'status' | 'createdAt' | 'updatedAt'>
    if (!fields?.providerId || !fields?.body || !fields?.scheduledFor) {
      throw new HttpsError('invalid-argument', 'providerId, body, scheduledFor required')
    }
    fields.userId = request.auth.uid
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.scheduleMessage(request.auth.uid, fields)
  }
)

export const listScheduledMessages = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getCommunicationEngine(request.auth.uid, db(), apiKey())
    return engine.listScheduledMessages(request.auth.uid)
  }
)
