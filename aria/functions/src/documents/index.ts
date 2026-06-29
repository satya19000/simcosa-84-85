import type * as admin from 'firebase-admin'
import { DocumentManager } from './DocumentManager'
import { DEFAULT_DOCUMENT_CONFIG } from './DocumentConfig'

// ── Per-user singleton sessions ───────────────────────────────────────────────

interface Session {
  manager: DocumentManager
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 15 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKey: string): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing
  const session: Session = {
    manager: new DocumentManager(db, DEFAULT_DOCUMENT_CONFIG, apiKey),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getDocumentManager(userId: string, db: admin.firestore.Firestore, apiKey: string): DocumentManager {
  return getSession(userId, db, apiKey).manager
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { DocumentManager } from './DocumentManager'
export { DocumentEngine } from './DocumentEngine'
export { DocumentRegistry } from './DocumentRegistry'
export { DocumentParser, registerOCRProvider, getOCRProvider } from './DocumentParser'
export { DocumentClassifier } from './DocumentClassifier'
export { DocumentIndexer } from './DocumentIndexer'
export { DocumentSummarizer } from './DocumentSummarizer'
export { DocumentChunker } from './DocumentChunker'
export { DocumentRetriever } from './DocumentRetriever'
export { DocumentSearch } from './DocumentSearch'
export { DocumentMetadata } from './DocumentMetadata'
export { DocumentPermissions } from './DocumentPermissions'
export { DocumentVersionManager } from './DocumentVersion'
export { DocumentAnalytics } from './DocumentAnalytics'
export { DocumentEvents } from './DocumentEvents'
export { DocumentEmbeddings, registerEmbeddingProvider, getEmbeddingProvider } from './DocumentEmbeddings'
export { DocumentRelations } from './DocumentRelations'
export { DocumentValidator } from './DocumentValidator'
export { DEFAULT_DOCUMENT_CONFIG } from './DocumentConfig'
export type { DocumentConfig } from './DocumentConfig'
export * from './DocumentTypes'
