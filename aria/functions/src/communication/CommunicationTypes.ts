// ── Provider Types ─────────────────────────────────────────────────────────────

export type ProviderType =
  | 'email'
  | 'whatsapp'
  | 'sms'
  | 'phone'
  | 'telegram'
  | 'signal'
  | 'slack'
  | 'teams'
  | 'google_chat'
  | 'custom'

export type ProviderStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'syncing'

export interface ProviderCredentials {
  type: ProviderType
  credentials: Record<string, string>
  scopes?: string[]
}

export interface ProviderHealth {
  providerId: string
  status: ProviderStatus
  lastCheckedAt: string
  latencyMs?: number
  error?: string
  messageQueueDepth?: number
}

// ── Message Types ─────────────────────────────────────────────────────────────

export type MessageContentType =
  | 'text'
  | 'html'
  | 'markdown'
  | 'voice'
  | 'audio'
  | 'image'
  | 'video'
  | 'pdf'
  | 'document'
  | 'location'
  | 'contact'
  | 'system'

export type MessageStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'archived'
  | 'deleted'

export type MessageDirection = 'inbound' | 'outbound'

export interface MessageAttachment {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  url?: string
  storageRef?: string
}

export interface MessageParticipant {
  id: string
  name: string
  address: string        // email, phone number, username
  type: 'person' | 'group' | 'bot' | 'system'
  avatarUrl?: string
  contactId?: string     // linked ARIA contact
  memoryNodeId?: string  // linked memory graph node
}

export interface CommunicationMessage {
  id: string
  threadId: string
  userId: string
  providerId: string
  providerType: ProviderType
  providerMessageId?: string  // external message id
  providerThreadId?: string  // provider's native thread/conversation grouping id
  direction: MessageDirection
  status: MessageStatus
  contentType: MessageContentType
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

// ── Thread Types ──────────────────────────────────────────────────────────────

export type ThreadStatus = 'active' | 'archived' | 'snoozed' | 'deleted'

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
  status: ThreadStatus
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

// ── Analysis Types ────────────────────────────────────────────────────────────

export type DetectedItemType =
  | 'follow_up_needed'
  | 'unanswered_question'
  | 'meeting_request'
  | 'deadline'
  | 'commitment'
  | 'promise'
  | 'decision'
  | 'risk_item'
  | 'action_item'

export interface DetectedItem {
  type: DetectedItemType
  description: string
  confidence: number
  extractedText?: string
  suggestedDate?: string
  participants?: string[]
}

export type SuggestionType =
  | 'create_task'
  | 'create_reminder'
  | 'schedule_meeting'
  | 'save_contact'
  | 'update_contact'
  | 'store_memory'
  | 'generate_briefing'

export interface ConversationSuggestion {
  id: string
  threadId: string
  type: SuggestionType
  title: string
  description: string
  confidence: number
  detectedItem?: DetectedItem
  accepted?: boolean
  dismissedAt?: string
  createdAt: string
}

export interface ThreadAnalysis {
  id: string
  threadId: string
  userId: string
  detectedItems: DetectedItem[]
  suggestions: ConversationSuggestion[]
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  topics: string[]
  namedEntities: string[]
  analyzedAt: string
}

// ── Summary Types ─────────────────────────────────────────────────────────────

export type SummaryType = 'thread' | 'daily' | 'weekly' | 'executive' | 'meeting' | 'action'

export interface ConversationSummary {
  id: string
  threadId?: string
  userId: string
  type: SummaryType
  title: string
  summary: string
  bulletPoints: string[]
  actionItems: string[]
  decisions: string[]
  participants: string[]
  dateRange?: { from: string; to: string }
  generatedAt: string
}

// ── Reply Types ───────────────────────────────────────────────────────────────

export type ReplyTone = 'professional' | 'short' | 'formal' | 'friendly' | 'public_health' | 'medical'

export interface GeneratedReply {
  id: string
  threadId: string
  messageId: string
  tone: ReplyTone
  body: string
  subject?: string
  generatedAt: string
  accepted?: boolean
}

// ── Communication Memory ──────────────────────────────────────────────────────

export interface ContactCommunicationStyle {
  contactId: string
  userId: string
  preferredChannel?: ProviderType
  preferredLanguage?: string
  typicalResponseSpeedMinutes?: number
  formalityLevel?: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal'
  workingHoursStart?: string   // HH:MM
  workingHoursEnd?: string
  timezone?: string
  lastInteractionAt?: string
  interactionCount: number
  notes?: string
  updatedAt: string
}

// ── Search ────────────────────────────────────────────────────────────────────

export type SearchScope = 'messages' | 'threads' | 'contacts' | 'memory' | 'all'

export interface CommunicationSearchOptions {
  query: string
  scope?: SearchScope
  providerType?: ProviderType
  limit?: number
  dateFrom?: string
  dateTo?: string
}

export interface CommunicationSearchResult {
  type: 'message' | 'thread' | 'contact' | 'memory'
  id: string
  threadId?: string
  title: string
  snippet: string
  score: number
  providerType?: ProviderType
  date?: string
}

// ── Events ────────────────────────────────────────────────────────────────────

export type CommunicationEventName =
  | 'message:received'
  | 'message:sent'
  | 'message:failed'
  | 'message:read'
  | 'thread:created'
  | 'thread:updated'
  | 'thread:archived'
  | 'provider:connected'
  | 'provider:disconnected'
  | 'provider:error'
  | 'analysis:complete'
  | 'suggestion:created'

export interface CommunicationEvent<T = unknown> {
  name: CommunicationEventName
  userId: string
  payload: T
  emittedAt: string
}

// ── Permissions ───────────────────────────────────────────────────────────────

export type CommunicationRole = 'owner' | 'reader' | 'agent' | 'plugin'

export interface CommunicationPermissionRecord {
  userId: string
  threadId: string
  role: CommunicationRole
  grantedAt: string
}

// ── Analytics ────────────────────────────────────────────────────────────────

export interface CommunicationStats {
  totalMessages: number
  totalThreads: number
  byProvider: Record<ProviderType, number>
  byDirection: { inbound: number; outbound: number }
  unreadCount: number
  avgResponseTimeMinutes?: number
  topParticipants: Array<{ name: string; count: number }>
  recentActivity: number  // messages in last 7 days
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export interface ScheduledMessage {
  id: string
  userId: string
  providerId: string
  threadId?: string
  to: MessageParticipant[]
  contentType: MessageContentType
  body: string
  subject?: string
  scheduledFor: string   // ISO datetime
  status: 'pending' | 'sent' | 'cancelled' | 'failed'
  createdAt: string
  updatedAt: string
}

// ── Templates ────────────────────────────────────────────────────────────────

export interface CommunicationTemplate {
  id: string
  userId: string
  name: string
  description?: string
  providerType?: ProviderType
  contentType: MessageContentType
  subject?: string
  body: string
  variables: string[]   // {{name}}, {{date}} etc.
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ── Provider Interface (base) ─────────────────────────────────────────────────

export interface ProviderSendOptions {
  to: MessageParticipant[]
  subject?: string
  body: string
  contentType: MessageContentType
  attachments?: MessageAttachment[]
  replyToId?: string
  scheduledFor?: string
}

export interface ProviderReceiveResult {
  messages: CommunicationMessage[]
  hasMore: boolean
  nextCursor?: string
}

export interface ProviderSearchResult {
  messages: CommunicationMessage[]
  total: number
}
