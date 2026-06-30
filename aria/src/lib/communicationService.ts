import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const getProviderHealthFn = httpsCallable(fns, 'getProviderHealth')
const listCommunicationProvidersFn = httpsCallable(fns, 'listCommunicationProviders')
const ingestCommunicationMessageFn = httpsCallable(fns, 'ingestCommunicationMessage')
const sendCommunicationMessageFn = httpsCallable(fns, 'sendCommunicationMessage')
const syncCommunicationProviderFn = httpsCallable(fns, 'syncCommunicationProvider')
const listConversationThreadsFn = httpsCallable(fns, 'listConversationThreads')
const getConversationMessagesFn = httpsCallable(fns, 'getConversationMessages')
const markThreadReadFn = httpsCallable(fns, 'markThreadRead')
const archiveConversationThreadFn = httpsCallable(fns, 'archiveConversationThread')
const analyzeConversationThreadFn = httpsCallable(fns, 'analyzeConversationThread')
const generateConversationSummaryFn = httpsCallable(fns, 'generateConversationSummary')
const generateAIReplyFn = httpsCallable(fns, 'generateAIReply')
const searchCommunicationsFn = httpsCallable(fns, 'searchCommunications')
const getCommunicationStatsFn = httpsCallable(fns, 'getCommunicationStats')
const createCommunicationTemplateFn = httpsCallable(fns, 'createCommunicationTemplate')
const listCommunicationTemplatesFn = httpsCallable(fns, 'listCommunicationTemplates')
const scheduleCommunicationMessageFn = httpsCallable(fns, 'scheduleCommunicationMessage')
const listScheduledMessagesFn = httpsCallable(fns, 'listScheduledMessages')

export type ProviderType =
  | 'email' | 'whatsapp' | 'sms' | 'phone' | 'telegram'
  | 'signal' | 'slack' | 'teams' | 'google_chat' | 'custom'

export interface ProviderHealth {
  providerId: string
  status: string
  lastCheckedAt: string
  latencyMs?: number
  error?: string
}

export interface MessageParticipant {
  name?: string
  address: string
  contactId?: string
}

export interface MessageAttachment {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  url?: string
}

export interface CommunicationMessage {
  id: string
  threadId: string
  userId: string
  providerId: string
  providerType: ProviderType
  providerMessageId?: string
  providerThreadId?: string
  direction: 'inbound' | 'outbound'
  status: string
  contentType: string
  subject?: string
  body: string
  bodyHtml?: string
  from: MessageParticipant
  to: MessageParticipant[]
  cc?: MessageParticipant[]
  bcc?: MessageParticipant[]
  attachments: MessageAttachment[]
  replyToId?: string
  forwardOfId?: string
  labels?: string[]
  starred?: boolean
  readAt?: string
  sentAt?: string
  receivedAt: string
  createdAt: string
  updatedAt: string
}

export interface ConversationThread {
  id: string
  userId: string
  providerId: string
  providerType: ProviderType
  providerThreadId?: string
  subject?: string
  participants: MessageParticipant[]
  lastMessageAt: string
  lastMessagePreview: string
  messageCount: number
  unreadCount: number
  status: string
  labels?: string[]
  starred?: boolean
  pinned?: boolean
  folderId?: string
  memoryNodeId?: string
  summaryId?: string
  analysisId?: string
  createdAt: string
  updatedAt: string
}

export interface ThreadAnalysis {
  threadId: string
  userId: string
  detectedItems: Array<{ type: string; text: string; confidence: number }>
  sentiment: string
  priority: string
  topics: string[]
  namedEntities: string[]
  suggestions: Array<{ type: string; title: string; description?: string }>
}

export interface ConversationSummary {
  id: string
  threadId: string
  userId: string
  type: string
  title: string
  summary: string
  bulletPoints: string[]
  actionItems: string[]
  decisions: string[]
  participants: string[]
  createdAt: string
}

export interface GeneratedReply {
  messageId: string
  tone: string
  text: string
}

export interface CommunicationSearchResult {
  type: 'message' | 'thread'
  id: string
  threadId: string
  title: string
  snippet: string
  score: number
  providerType: ProviderType
  date: string
}

export interface CommunicationStats {
  totalMessages: number
  totalThreads: number
  byProvider: Record<string, number>
  byDirection: Record<string, number>
  unreadCount: number
  topParticipants: Array<{ address: string; count: number }>
  recentActivity: Array<{ date: string; count: number }>
}

export interface CommunicationTemplate {
  id: string
  userId: string
  name: string
  body: string
  providerType?: ProviderType
  createdAt: string
  updatedAt: string
}

export interface ScheduledMessage {
  id: string
  userId: string
  providerId: string
  body: string
  scheduledFor: string
  status: string
  createdAt: string
  updatedAt: string
}

export async function getProviderHealth(): Promise<ProviderHealth[]> {
  const result = await getProviderHealthFn({})
  return result.data as ProviderHealth[]
}

export async function listCommunicationProviders(): Promise<Array<{ id: string; name: string; type: ProviderType }>> {
  const result = await listCommunicationProvidersFn({})
  return result.data as Array<{ id: string; name: string; type: ProviderType }>
}

export async function ingestCommunicationMessage(message: Partial<CommunicationMessage>): Promise<ConversationThread> {
  const result = await ingestCommunicationMessageFn(message)
  return result.data as ConversationThread
}

export async function sendCommunicationMessage(providerId: string, opts: { body: string; to?: MessageParticipant[]; subject?: string }): Promise<CommunicationMessage> {
  const result = await sendCommunicationMessageFn({ providerId, opts })
  return result.data as CommunicationMessage
}

export async function syncCommunicationProvider(providerId: string): Promise<{ synced: number }> {
  const result = await syncCommunicationProviderFn({ providerId })
  return result.data as { synced: number }
}

export async function listConversationThreads(opts?: { limit?: number; providerType?: ProviderType; status?: string }): Promise<ConversationThread[]> {
  const result = await listConversationThreadsFn(opts ?? {})
  return result.data as ConversationThread[]
}

export async function getConversationMessages(threadId: string, limit?: number): Promise<CommunicationMessage[]> {
  const result = await getConversationMessagesFn({ threadId, limit })
  return result.data as CommunicationMessage[]
}

export async function markThreadRead(threadId: string): Promise<void> {
  await markThreadReadFn({ threadId })
}

export async function archiveConversationThread(threadId: string): Promise<void> {
  await archiveConversationThreadFn({ threadId })
}

export async function analyzeConversationThread(threadId: string): Promise<ThreadAnalysis> {
  const result = await analyzeConversationThreadFn({ threadId })
  return result.data as ThreadAnalysis
}

export async function generateConversationSummary(threadId: string, type?: string): Promise<ConversationSummary> {
  const result = await generateConversationSummaryFn({ threadId, type })
  return result.data as ConversationSummary
}

export async function generateAIReply(messageId: string, tone: string): Promise<GeneratedReply> {
  const result = await generateAIReplyFn({ messageId, tone })
  return result.data as GeneratedReply
}

export async function searchCommunications(opts: { query: string; scope?: string; limit?: number }): Promise<CommunicationSearchResult[]> {
  const result = await searchCommunicationsFn(opts)
  return result.data as CommunicationSearchResult[]
}

export async function getCommunicationStats(): Promise<CommunicationStats> {
  const result = await getCommunicationStatsFn({})
  return result.data as CommunicationStats
}

export async function createCommunicationTemplate(fields: { name: string; body: string; providerType?: ProviderType }): Promise<CommunicationTemplate> {
  const result = await createCommunicationTemplateFn(fields)
  return result.data as CommunicationTemplate
}

export async function listCommunicationTemplates(providerType?: ProviderType): Promise<CommunicationTemplate[]> {
  const result = await listCommunicationTemplatesFn({ providerType })
  return result.data as CommunicationTemplate[]
}

export async function scheduleCommunicationMessage(fields: { providerId: string; body: string; scheduledFor: string }): Promise<ScheduledMessage> {
  const result = await scheduleCommunicationMessageFn(fields)
  return result.data as ScheduledMessage
}

export async function listScheduledMessages(): Promise<ScheduledMessage[]> {
  const result = await listScheduledMessagesFn({})
  return result.data as ScheduledMessage[]
}
