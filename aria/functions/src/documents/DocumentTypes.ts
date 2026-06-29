// ── Document formats ──────────────────────────────────────────────────────────

export type DocumentFormat =
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'md'
  | 'rtf'
  | 'csv'
  | 'xlsx'
  | 'pptx'
  | 'image'
  | 'scanned_image'
  | 'screenshot'
  | 'medical_report'
  | 'government_circular'
  | 'official_letter'
  | 'custom'

export type DocumentCategory =
  | 'medical'
  | 'government'
  | 'finance'
  | 'legal'
  | 'personal'
  | 'education'
  | 'research'
  | 'public_health'
  | 'meeting_notes'
  | 'project'
  | 'invoice'
  | 'receipt'
  | 'custom'

export type DocumentStatus =
  | 'pending'
  | 'processing'
  | 'indexed'
  | 'failed'
  | 'archived'
  | 'deleted'

export type ChunkType = 'paragraph' | 'heading' | 'table' | 'list' | 'form' | 'code' | 'image_caption' | 'metadata'

// ── Core document model ───────────────────────────────────────────────────────

export interface DocumentRecord {
  id: string
  userId: string
  title: string
  format: DocumentFormat
  category: DocumentCategory
  status: DocumentStatus
  storageRef: string       // Firebase Storage path
  mimeType: string
  sizeBytes: number
  pageCount: number
  language: string
  tags: string[]
  pinned: boolean
  starred: boolean
  folderId?: string
  version: number
  createdAt: string
  updatedAt: string
  processedAt?: string
  processingError?: string
}

// ── Parsed content ────────────────────────────────────────────────────────────

export interface DocumentChunk {
  id: string
  documentId: string
  userId: string
  index: number            // position in document
  type: ChunkType
  text: string
  pageNumber?: number
  metadata: Record<string, unknown>
  embeddingId?: string     // reference to stored embedding
  createdAt: string
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export interface DocumentMetadataRecord {
  documentId: string
  userId: string
  author?: string
  organization?: string
  createdDate?: string
  modifiedDate?: string
  subject?: string
  keywords: string[]
  language: string
  sections: string[]
  headings: string[]
  hasImages: boolean
  hasTables: boolean
  hasForms: boolean
  ocrApplied: boolean
  ocrProvider?: string
  ocrConfidence?: number
  wordCount: number
  extractedAt: string
}

// ── Summary ───────────────────────────────────────────────────────────────────

export interface DocumentSummaryRecord {
  documentId: string
  userId: string
  shortSummary: string
  executiveSummary: string
  bulletPoints: string[]
  actionItems: string[]
  deadlines: string[]
  riskPoints: string[]
  timeline: string[]
  generatedAt: string
}

// ── Entities ──────────────────────────────────────────────────────────────────

export interface ExtractedEntity {
  type: EntityType
  value: string
  context?: string         // surrounding sentence
  pageNumber?: number
  confidence: number
}

export type EntityType =
  | 'person'
  | 'organization'
  | 'hospital'
  | 'medicine'
  | 'disease'
  | 'program'
  | 'location'
  | 'date'
  | 'phone'
  | 'email'
  | 'url'
  | 'project'
  | 'task'
  | 'reminder'
  | 'amount'
  | 'percentage'
  | 'custom'

export interface DocumentEntitiesRecord {
  documentId: string
  userId: string
  entities: ExtractedEntity[]
  extractedAt: string
}

// ── Suggested actions ─────────────────────────────────────────────────────────

export type SuggestedActionType = 'create_task' | 'create_reminder' | 'create_calendar_event' | 'create_contact'

export interface SuggestedAction {
  type: SuggestedActionType
  title: string
  description: string
  suggestedDate?: string
  extractedFrom: string    // source sentence
  confidence: number
  accepted?: boolean
}

export interface DocumentActionsRecord {
  documentId: string
  userId: string
  suggestions: SuggestedAction[]
  generatedAt: string
}

// ── OCR ───────────────────────────────────────────────────────────────────────

export interface OCRResult {
  text: string
  confidence: number
  provider: string
  pageResults: Array<{ page: number; text: string; confidence: number }>
  processedAt: string
}

export interface OCRProvider {
  readonly name: string
  readonly supportsHandwriting: boolean
  ocr(imageBuffer: Buffer, mimeType: string): Promise<OCRResult>
}

// ── Embedding ─────────────────────────────────────────────────────────────────

export interface EmbeddingVector {
  id: string
  documentId: string
  chunkId: string
  userId: string
  provider: string
  dimensions: number
  vector: number[]
  createdAt: string
}

export interface EmbeddingProvider {
  readonly name: string
  readonly dimensions: number
  embed(texts: string[]): Promise<number[][]>
  embedOne(text: string): Promise<number[]>
}

// ── Search ────────────────────────────────────────────────────────────────────

export type DocumentSearchMode = 'keyword' | 'semantic' | 'hybrid' | 'metadata' | 'relationship'

export interface DocumentSearchOptions {
  query: string
  mode: DocumentSearchMode
  userId: string
  categories?: DocumentCategory[]
  formats?: DocumentFormat[]
  tags?: string[]
  dateRange?: { from: string; to: string }
  maxResults?: number
  includeChunks?: boolean
}

export interface DocumentSearchResult {
  document: DocumentRecord
  score: number
  matchReason: string
  matchedChunks?: Array<{ text: string; score: number }>
  summary?: string
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface DocumentAnalyticsSnapshot {
  totalDocuments: number
  byCategory: Record<string, number>
  byFormat: Record<string, number>
  byStatus: Record<string, number>
  totalChunks: number
  totalWords: number
  pendingReview: number
  needsAction: number
  recentUploads: number  // last 7 days
  topTags: Array<{ tag: string; count: number }>
  storageBytes: number
  computedAt: string
}

// ── Events ────────────────────────────────────────────────────────────────────

export type DocumentEventName =
  | 'document:uploaded'
  | 'document:parsed'
  | 'document:summarized'
  | 'document:indexed'
  | 'document:classified'
  | 'document:graph:linked'
  | 'document:action:suggested'
  | 'document:deleted'
  | 'document:error'

export interface DocumentEvent<T = unknown> {
  name: DocumentEventName
  documentId: string
  userId: string
  payload: T
  emittedAt: string
}

// ── Folder ────────────────────────────────────────────────────────────────────

export interface DocumentFolder {
  id: string
  userId: string
  name: string
  parentId?: string
  color?: string
  createdAt: string
  updatedAt: string
}

// ── Version ───────────────────────────────────────────────────────────────────

export interface DocumentVersion {
  id: string
  documentId: string
  userId: string
  version: number
  storageRef: string
  sizeBytes: number
  changeNote?: string
  uploadedAt: string
}
