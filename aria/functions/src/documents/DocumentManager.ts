import type * as admin from 'firebase-admin'
import type { DocumentRecord, DocumentCategory, DocumentFormat } from './DocumentTypes'
import type { DocumentConfig } from './DocumentConfig'
import { DocumentEngine, type IngestInput, type IngestResult } from './DocumentEngine'
import { DocumentRegistry } from './DocumentRegistry'
import { DocumentSearch, type SearchOptions, type SearchResult } from './DocumentSearch'
import { DocumentChunker } from './DocumentChunker'
import { DocumentAnalytics, type DocumentStats } from './DocumentAnalytics'
import { DocumentIndexer } from './DocumentIndexer'
import { DocumentRetriever } from './DocumentRetriever'

export class DocumentManager {
  private readonly engine: DocumentEngine
  private readonly registry: DocumentRegistry
  private readonly search: DocumentSearch
  private readonly chunker: DocumentChunker
  private readonly analytics: DocumentAnalytics
  private readonly indexer: DocumentIndexer
  private readonly retriever: DocumentRetriever

  constructor(
    db: admin.firestore.Firestore,
    config: DocumentConfig,
    apiKey: string
  ) {
    this.engine = new DocumentEngine(db, config, apiKey)
    this.registry = new DocumentRegistry(db)
    this.search = new DocumentSearch(db, config, apiKey)
    this.chunker = new DocumentChunker(db)
    this.analytics = new DocumentAnalytics(db)
    this.indexer = new DocumentIndexer(db, config)
    this.retriever = new DocumentRetriever(db, config, apiKey)
  }

  async ingestDocument(input: IngestInput): Promise<IngestResult> {
    return this.engine.ingest(input)
  }

  async getDocument(userId: string, documentId: string): Promise<DocumentRecord | null> {
    return this.registry.get(userId, documentId)
  }

  async listDocuments(
    userId: string,
    opts: { limit?: number; category?: DocumentCategory; format?: DocumentFormat; folderId?: string | null } = {}
  ): Promise<DocumentRecord[]> {
    return this.registry.list(userId, opts)
  }

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    await this.registry.softDelete(userId, documentId)
    await this.chunker.deleteChunks(userId, documentId)
    await this.indexer.removeEntry(userId, documentId)
  }

  async searchDocuments(userId: string, opts: SearchOptions): Promise<SearchResult[]> {
    return this.search.search(userId, opts)
  }

  async chatWithDocument(userId: string, documentId: string, question: string): Promise<string> {
    return this.retriever.chat(userId, documentId, question)
  }

  async getStats(userId: string): Promise<DocumentStats> {
    return this.analytics.getStats(userId)
  }

  async createFolder(userId: string, name: string, parentId?: string, color?: string) {
    return this.registry.createFolder(userId, name, parentId, color)
  }

  async listFolders(userId: string) {
    return this.registry.listFolders(userId)
  }

  async rebuildIndex(userId: string): Promise<void> {
    return this.indexer.rebuild(userId)
  }
}
