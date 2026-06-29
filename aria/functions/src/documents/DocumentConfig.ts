export interface DocumentConfig {
  /** Max file size in bytes accepted for processing */
  maxFileSizeBytes: number
  /** Max pages to OCR (prevents runaway costs) */
  maxOCRPages: number
  /** Target characters per chunk */
  chunkTargetChars: number
  /** Overlap between adjacent chunks in characters */
  chunkOverlapChars: number
  /** Token budget for summary generation */
  summaryTokenBudget: number
  /** Max entities to extract per document */
  maxEntities: number
  /** Minimum OCR confidence to keep result (0-1) */
  minOCRConfidence: number
  /** Minimum action suggestion confidence (0-1) */
  minActionConfidence: number
  /** In-memory index TTL (ms) */
  indexCacheTTLMs: number
  /** Enable embedding generation */
  embeddingsEnabled: boolean
  /** Default OCR provider name */
  defaultOCRProvider: string
  /** Default embedding provider name */
  defaultEmbeddingProvider: string
}

export const DEFAULT_DOCUMENT_CONFIG: DocumentConfig = {
  maxFileSizeBytes: 50 * 1024 * 1024,  // 50 MB
  maxOCRPages: 100,
  chunkTargetChars: 1200,
  chunkOverlapChars: 150,
  summaryTokenBudget: 2048,
  maxEntities: 100,
  minOCRConfidence: 0.6,
  minActionConfidence: 0.7,
  indexCacheTTLMs: 10 * 60 * 1000,
  embeddingsEnabled: false,             // enable when vector DB is wired
  defaultOCRProvider: 'claude-vision',
  defaultEmbeddingProvider: 'noop',
}

export function resolveDocumentConfig(override?: Partial<DocumentConfig>): DocumentConfig {
  return { ...DEFAULT_DOCUMENT_CONFIG, ...override }
}
