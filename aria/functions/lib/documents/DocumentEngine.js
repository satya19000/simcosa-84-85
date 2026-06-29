"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentEngine = void 0;
const DocumentRegistry_1 = require("./DocumentRegistry");
const DocumentParser_1 = require("./DocumentParser");
const DocumentClassifier_1 = require("./DocumentClassifier");
const DocumentChunker_1 = require("./DocumentChunker");
const DocumentSummarizer_1 = require("./DocumentSummarizer");
const DocumentMetadata_1 = require("./DocumentMetadata");
const DocumentIndexer_1 = require("./DocumentIndexer");
const DocumentRelations_1 = require("./DocumentRelations");
const DocumentEmbeddings_1 = require("./DocumentEmbeddings");
const DocumentEvents_1 = require("./DocumentEvents");
class DocumentEngine {
    constructor(db, config, apiKey) {
        this.registry = new DocumentRegistry_1.DocumentRegistry(db);
        this.parser = new DocumentParser_1.DocumentParser(config, apiKey);
        this.classifier = new DocumentClassifier_1.DocumentClassifier(apiKey);
        this.chunker = new DocumentChunker_1.DocumentChunker(db);
        this.summarizer = new DocumentSummarizer_1.DocumentSummarizer(config, apiKey);
        this.metadata = new DocumentMetadata_1.DocumentMetadata(db);
        this.indexer = new DocumentIndexer_1.DocumentIndexer(db, config);
        this.relations = new DocumentRelations_1.DocumentRelations(db, apiKey);
        this.embeddings = new DocumentEmbeddings_1.DocumentEmbeddings(db, config.defaultEmbeddingProvider);
    }
    async ingest(input) {
        const filename = input.filename ?? input.title;
        const format = this.classifier.inferFormat(input.mimeType, filename);
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
        });
        void DocumentEvents_1.DocumentEvents.emit('document:uploaded', document.id, input.userId, {});
        try {
            let rawText = input.rawText ?? '';
            if (!rawText && input.imageBuffer) {
                const ocrResult = await this.parser.ocrBuffer(input.imageBuffer, input.mimeType, input.ocrProviderName);
                rawText = ocrResult.text;
            }
            const category = await this.classifier.classify(rawText, input.mimeType, filename);
            await this.registry.update(input.userId, document.id, { category });
            document.category = category;
            const { chunks, metadata: basicMeta } = await this.parser.parse(document, rawText);
            await this.chunker.saveChunks(chunks);
            const structuredMeta = await this.parser.extractStructuredMetadata(rawText, document);
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
            };
            await this.metadata.save(mergedMeta);
            const summary = await this.summarizer.summarize(document, rawText);
            const entities = await this.relations.extractEntities(document, rawText);
            await this.relations.linkToMemoryGraph(document, rawText, entities);
            await this.embeddings.embedChunks(chunks);
            await this.indexer.addEntry(input.userId, { ...document, category, tags: input.tags ?? [] });
            await this.registry.setStatus(input.userId, document.id, 'indexed');
            void DocumentEvents_1.DocumentEvents.emit('document:indexed', document.id, input.userId, {});
            return {
                document: { ...document, category, status: 'indexed' },
                summary,
                entities,
                suggestions: [],
                chunkCount: chunks.length,
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            await this.registry.setStatus(input.userId, document.id, 'failed', msg);
            void DocumentEvents_1.DocumentEvents.emit('document:error', document.id, input.userId, { error: msg });
            throw err;
        }
    }
}
exports.DocumentEngine = DocumentEngine;
//# sourceMappingURL=DocumentEngine.js.map