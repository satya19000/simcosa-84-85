"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentManager = void 0;
const DocumentEngine_1 = require("./DocumentEngine");
const DocumentRegistry_1 = require("./DocumentRegistry");
const DocumentSearch_1 = require("./DocumentSearch");
const DocumentChunker_1 = require("./DocumentChunker");
const DocumentAnalytics_1 = require("./DocumentAnalytics");
const DocumentIndexer_1 = require("./DocumentIndexer");
const DocumentRetriever_1 = require("./DocumentRetriever");
class DocumentManager {
    constructor(db, config, apiKey) {
        this.engine = new DocumentEngine_1.DocumentEngine(db, config, apiKey);
        this.registry = new DocumentRegistry_1.DocumentRegistry(db);
        this.search = new DocumentSearch_1.DocumentSearch(db, config, apiKey);
        this.chunker = new DocumentChunker_1.DocumentChunker(db);
        this.analytics = new DocumentAnalytics_1.DocumentAnalytics(db);
        this.indexer = new DocumentIndexer_1.DocumentIndexer(db, config);
        this.retriever = new DocumentRetriever_1.DocumentRetriever(db, config, apiKey);
    }
    async ingestDocument(input) {
        return this.engine.ingest(input);
    }
    async getDocument(userId, documentId) {
        return this.registry.get(userId, documentId);
    }
    async listDocuments(userId, opts = {}) {
        return this.registry.list(userId, opts);
    }
    async deleteDocument(userId, documentId) {
        await this.registry.softDelete(userId, documentId);
        await this.chunker.deleteChunks(userId, documentId);
        await this.indexer.removeEntry(userId, documentId);
    }
    async searchDocuments(userId, opts) {
        return this.search.search(userId, opts);
    }
    async chatWithDocument(userId, documentId, question) {
        return this.retriever.chat(userId, documentId, question);
    }
    async getStats(userId) {
        return this.analytics.getStats(userId);
    }
    async createFolder(userId, name, parentId, color) {
        return this.registry.createFolder(userId, name, parentId, color);
    }
    async listFolders(userId) {
        return this.registry.listFolders(userId);
    }
    async rebuildIndex(userId) {
        return this.indexer.rebuild(userId);
    }
}
exports.DocumentManager = DocumentManager;
//# sourceMappingURL=DocumentManager.js.map