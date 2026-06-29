import type * as admin from 'firebase-admin'
import type { DocumentRecord, DocumentSummaryRecord, ExtractedEntity, SuggestedAction } from './DocumentTypes'
import type { DocumentConfig } from './DocumentConfig'
import { DocumentRegistry } from './DocumentRegistry'
import { DocumentParser } from './DocumentParser'
import { DocumentClassifier } from './DocumentClassifier'
import { DocumentChunker } from './DocumentChunker'
import { DocumentSummarizer } from './DocumentSummarizer'
import { DocumentMetadata } from './DocumentMetadata'
import { DocumentIndexer } from './DocumentIndexer'
import { DocumentRelations } from './DocumentRelations'
import { DocumentEmbeddings } from './DocumentEmbeddings'
import { DocumentEvents as documentEvents } from './DocumentEvents'

export interface IngestInput {
  userId: string
  title: string
  mimeType: string
  sizeBytes: number
  storageRef: string
  rawText?: string
  imageBuffer?: Buffer
  filename?: string
  folderId?: string
  tags?: string[]
  ocrProviderName?: string
}

export interface IngestResult {
  document: DocumentRecord
  summary: DocumentSummaryRecord
  entities: ExtractedEntity[]
  suggestions: SuggestedAction[]
  chunkCount: number
}

export class DocumentEngine {
  private readonly registry: DocumentRegistry
  private readonly parser: DocumentParser
  private readonly classifier: DocumentClassifier
  private readonly chunker: DocumentChunker
  private readonly summarizer: DocumentSummarizer
  private readonly metadata: DocumentMetadata
  private readonly indexer: DocumentIndexer
  private readonly relations: DocumentRelations
  private readonly embeddings: DocumentEmbeddings

  constructor(
    db: admin.firestore.Firestore,
    config: DocumentConfig,
    apiKey: string
  ) {
    this.registry = new DocumentRegistry(db)
    this.parser = new DocumentParser(config, apiKey)
    this.classifier = new DocumentClassifier(apiKey)
    this.chunker = new DocumentChunker(db)
    this.summarizer = new DocumentSummarizer(config, apiKey)
    this.metadata = new DocumentMetadata(db)
    this.indexer = new DocumentIndexer(db, config)
    this.relations = new DocumentRelations(db, apiKey)
    this.embeddings = new DocumentEmbeddings(db, config.defaultEmbeddingProvider)
  }

  async ingest(input: IngestInput): Promise<IngestResult> {
    const filename = input.filename ?? input.title
    const format = this.classifier.inferFormat(input.mimeType, filename)

    const document = await this.registry.create(input.userId, {
      title: input.title,
      format,
      category: 'custom',
      status: 'processing',
      storageRef: input.storageRef,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      pageCount: 0,
      language: 'en',
      tags: input.tags ?? [],
      pinned: false,
      starred: false,
      folderId: input.folderId,
    })

    void documentEvents.emit('document:uploaded', document.id, input.userId, {})

    try {
      let rawText = input.rawText ?? ''
      if (!rawText && input.imageBuffer) {
        const ocrResult = await this.parser.ocrBuffer(input.imageBuffer, input.mimeType, input.ocrProviderName)
        rawText = ocrResult.text
      }

      const category = await this.classifier.classify(rawText, input.mimeType, filename)
      await this.registry.update(input.userId, document.id, { category })
      document.category = category

      const { chunks, metadata: basicMeta } = await this.parser.parse(document, rawText)
      await this.chunker.saveChunks(chunks)

      const structuredMeta = await this.parser.extractStructuredMetadata(rawText, document)
      const mergedMeta = {
        documentId: document.id,
        userId: input.userId,
        keywords: [],
        language: 'en',
        sections: [],
        headings: [],
        hasImages: false,
        hasTables: false,
        hasForms: false,
        ocrApplied: !!input.imageBuffer,
        wordCount: 0,
        extractedAt: new Date().toISOString(),
        ...basicMeta,
        ...structuredMeta,
      }
      await this.metadata.save(mergedMeta)

      const summary = await this.summarizer.summarize(document, rawText)
      const entities = await this.relations.extractEntities(document, rawText)
      await this.relations.linkToMemoryGraph(document, rawText, entities)
      await this.embeddings.embedChunks(chunks)
      await this.indexer.addEntry(input.userId, { ...document, category, tags: input.tags ?? [] })
      await this.registry.setStatus(input.userId, document.id, 'indexed')

      void documentEvents.emit('document:indexed', document.id, input.userId, {})

      return {
        document: { ...document, category, status: 'indexed' },
        summary,
        entities,
        suggestions: [],
        chunkCount: chunks.length,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await this.registry.setStatus(input.userId, document.id, 'failed', msg)
      void documentEvents.emit('document:error', document.id, input.userId, { error: msg })
      throw err
    }
  }
}
