"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DOCUMENT_CONFIG = void 0;
exports.resolveDocumentConfig = resolveDocumentConfig;
exports.DEFAULT_DOCUMENT_CONFIG = {
    maxFileSizeBytes: 50 * 1024 * 1024, // 50 MB
    maxOCRPages: 100,
    chunkTargetChars: 1200,
    chunkOverlapChars: 150,
    summaryTokenBudget: 2048,
    maxEntities: 100,
    minOCRConfidence: 0.6,
    minActionConfidence: 0.7,
    indexCacheTTLMs: 10 * 60 * 1000,
    embeddingsEnabled: false, // enable when vector DB is wired
    defaultOCRProvider: 'claude-vision',
    defaultEmbeddingProvider: 'noop',
};
function resolveDocumentConfig(override) {
    return { ...exports.DEFAULT_DOCUMENT_CONFIG, ...override };
}
//# sourceMappingURL=DocumentConfig.js.map