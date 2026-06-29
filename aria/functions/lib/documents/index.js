"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DOCUMENT_CONFIG = exports.DocumentValidator = exports.DocumentRelations = exports.getEmbeddingProvider = exports.registerEmbeddingProvider = exports.DocumentEmbeddings = exports.DocumentEvents = exports.DocumentAnalytics = exports.DocumentVersionManager = exports.DocumentPermissions = exports.DocumentMetadata = exports.DocumentSearch = exports.DocumentRetriever = exports.DocumentChunker = exports.DocumentSummarizer = exports.DocumentIndexer = exports.DocumentClassifier = exports.getOCRProvider = exports.registerOCRProvider = exports.DocumentParser = exports.DocumentRegistry = exports.DocumentEngine = exports.DocumentManager = void 0;
exports.getDocumentManager = getDocumentManager;
const DocumentManager_1 = require("./DocumentManager");
const DocumentConfig_1 = require("./DocumentConfig");
const sessions = new Map();
const SESSION_TTL_MS = 15 * 60 * 1000;
function getSession(userId, db, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const session = {
        manager: new DocumentManager_1.DocumentManager(db, DocumentConfig_1.DEFAULT_DOCUMENT_CONFIG, apiKey),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getDocumentManager(userId, db, apiKey) {
    return getSession(userId, db, apiKey).manager;
}
// ── Re-exports ────────────────────────────────────────────────────────────────
var DocumentManager_2 = require("./DocumentManager");
Object.defineProperty(exports, "DocumentManager", { enumerable: true, get: function () { return DocumentManager_2.DocumentManager; } });
var DocumentEngine_1 = require("./DocumentEngine");
Object.defineProperty(exports, "DocumentEngine", { enumerable: true, get: function () { return DocumentEngine_1.DocumentEngine; } });
var DocumentRegistry_1 = require("./DocumentRegistry");
Object.defineProperty(exports, "DocumentRegistry", { enumerable: true, get: function () { return DocumentRegistry_1.DocumentRegistry; } });
var DocumentParser_1 = require("./DocumentParser");
Object.defineProperty(exports, "DocumentParser", { enumerable: true, get: function () { return DocumentParser_1.DocumentParser; } });
Object.defineProperty(exports, "registerOCRProvider", { enumerable: true, get: function () { return DocumentParser_1.registerOCRProvider; } });
Object.defineProperty(exports, "getOCRProvider", { enumerable: true, get: function () { return DocumentParser_1.getOCRProvider; } });
var DocumentClassifier_1 = require("./DocumentClassifier");
Object.defineProperty(exports, "DocumentClassifier", { enumerable: true, get: function () { return DocumentClassifier_1.DocumentClassifier; } });
var DocumentIndexer_1 = require("./DocumentIndexer");
Object.defineProperty(exports, "DocumentIndexer", { enumerable: true, get: function () { return DocumentIndexer_1.DocumentIndexer; } });
var DocumentSummarizer_1 = require("./DocumentSummarizer");
Object.defineProperty(exports, "DocumentSummarizer", { enumerable: true, get: function () { return DocumentSummarizer_1.DocumentSummarizer; } });
var DocumentChunker_1 = require("./DocumentChunker");
Object.defineProperty(exports, "DocumentChunker", { enumerable: true, get: function () { return DocumentChunker_1.DocumentChunker; } });
var DocumentRetriever_1 = require("./DocumentRetriever");
Object.defineProperty(exports, "DocumentRetriever", { enumerable: true, get: function () { return DocumentRetriever_1.DocumentRetriever; } });
var DocumentSearch_1 = require("./DocumentSearch");
Object.defineProperty(exports, "DocumentSearch", { enumerable: true, get: function () { return DocumentSearch_1.DocumentSearch; } });
var DocumentMetadata_1 = require("./DocumentMetadata");
Object.defineProperty(exports, "DocumentMetadata", { enumerable: true, get: function () { return DocumentMetadata_1.DocumentMetadata; } });
var DocumentPermissions_1 = require("./DocumentPermissions");
Object.defineProperty(exports, "DocumentPermissions", { enumerable: true, get: function () { return DocumentPermissions_1.DocumentPermissions; } });
var DocumentVersion_1 = require("./DocumentVersion");
Object.defineProperty(exports, "DocumentVersionManager", { enumerable: true, get: function () { return DocumentVersion_1.DocumentVersionManager; } });
var DocumentAnalytics_1 = require("./DocumentAnalytics");
Object.defineProperty(exports, "DocumentAnalytics", { enumerable: true, get: function () { return DocumentAnalytics_1.DocumentAnalytics; } });
var DocumentEvents_1 = require("./DocumentEvents");
Object.defineProperty(exports, "DocumentEvents", { enumerable: true, get: function () { return DocumentEvents_1.DocumentEvents; } });
var DocumentEmbeddings_1 = require("./DocumentEmbeddings");
Object.defineProperty(exports, "DocumentEmbeddings", { enumerable: true, get: function () { return DocumentEmbeddings_1.DocumentEmbeddings; } });
Object.defineProperty(exports, "registerEmbeddingProvider", { enumerable: true, get: function () { return DocumentEmbeddings_1.registerEmbeddingProvider; } });
Object.defineProperty(exports, "getEmbeddingProvider", { enumerable: true, get: function () { return DocumentEmbeddings_1.getEmbeddingProvider; } });
var DocumentRelations_1 = require("./DocumentRelations");
Object.defineProperty(exports, "DocumentRelations", { enumerable: true, get: function () { return DocumentRelations_1.DocumentRelations; } });
var DocumentValidator_1 = require("./DocumentValidator");
Object.defineProperty(exports, "DocumentValidator", { enumerable: true, get: function () { return DocumentValidator_1.DocumentValidator; } });
var DocumentConfig_2 = require("./DocumentConfig");
Object.defineProperty(exports, "DEFAULT_DOCUMENT_CONFIG", { enumerable: true, get: function () { return DocumentConfig_2.DEFAULT_DOCUMENT_CONFIG; } });
__exportStar(require("./DocumentTypes"), exports);
//# sourceMappingURL=index.js.map