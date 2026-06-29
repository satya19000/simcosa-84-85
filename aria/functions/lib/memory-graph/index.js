"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MEMORY_CONFIG = exports.MemoryPermissions = exports.MemoryEvents = void 0;
exports.getMemoryGraph = getMemoryGraph;
exports.getGraphBuilder = getGraphBuilder;
exports.getGraphRetriever = getGraphRetriever;
exports.getGraphSearch = getGraphSearch;
exports.getGraphIndexer = getGraphIndexer;
exports.getMemoryValidator = getMemoryValidator;
exports.getMemoryAnalytics = getMemoryAnalytics;
exports.getRelationshipEngine = getRelationshipEngine;
exports.getMemoryVersioning = getMemoryVersioning;
exports.retrieveMemoryContext = retrieveMemoryContext;
exports.getGraphStats = getGraphStats;
const MemoryGraph_1 = require("./MemoryGraph");
const GraphBuilder_1 = require("./GraphBuilder");
const GraphIndexer_1 = require("./GraphIndexer");
const GraphRetriever_1 = require("./GraphRetriever");
const GraphSearch_1 = require("./GraphSearch");
const RelationshipEngine_1 = require("./RelationshipEngine");
const KnowledgeIndex_1 = require("./KnowledgeIndex");
const MemoryScorer_1 = require("./MemoryScorer");
const MemoryCompressor_1 = require("./MemoryCompressor");
const MemoryExpander_1 = require("./MemoryExpander");
const MemoryValidator_1 = require("./MemoryValidator");
const MemoryVersioning_1 = require("./MemoryVersioning");
const MemoryAnalytics_1 = require("./MemoryAnalytics");
const MemoryConfig_1 = require("./MemoryConfig");
Object.defineProperty(exports, "DEFAULT_MEMORY_CONFIG", { enumerable: true, get: function () { return MemoryConfig_1.DEFAULT_MEMORY_CONFIG; } });
var MemoryEvents_1 = require("./MemoryEvents");
Object.defineProperty(exports, "MemoryEvents", { enumerable: true, get: function () { return MemoryEvents_1.MemoryEvents; } });
var MemoryPermissions_1 = require("./MemoryPermissions");
Object.defineProperty(exports, "MemoryPermissions", { enumerable: true, get: function () { return MemoryPermissions_1.MemoryPermissions; } });
const sessions = new Map();
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 min
function getOrCreateSession(userId, db, apiKey, configOverride) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const config = (0, MemoryConfig_1.resolveMemoryConfig)(configOverride);
    const graph = new MemoryGraph_1.MemoryGraph(db, userId);
    const index = new KnowledgeIndex_1.KnowledgeIndex(graph, config);
    const indexer = new GraphIndexer_1.GraphIndexer(index, graph);
    const scorer = new MemoryScorer_1.MemoryScorer(config);
    const compressor = new MemoryCompressor_1.MemoryCompressor(apiKey);
    const expander = new MemoryExpander_1.MemoryExpander(graph);
    const relationshipEngine = new RelationshipEngine_1.RelationshipEngine(graph, config, apiKey);
    const search = new GraphSearch_1.GraphSearch(graph, index, scorer, relationshipEngine, config, apiKey);
    const retriever = new GraphRetriever_1.GraphRetriever(search, graph, expander, compressor, config);
    const builder = new GraphBuilder_1.GraphBuilder(db, userId, apiKey, config);
    const validator = new MemoryValidator_1.MemoryValidator(graph);
    const versioning = new MemoryVersioning_1.MemoryVersioning(db, userId);
    const analytics = new MemoryAnalytics_1.MemoryAnalytics(graph, config);
    const session = {
        graph, index, indexer, scorer, compressor, expander,
        relationshipEngine, search, retriever, builder,
        validator, versioning, analytics,
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
// ── Public API ────────────────────────────────────────────────────────────────
function getMemoryGraph(userId, db, apiKey) {
    return getOrCreateSession(userId, db, apiKey).graph;
}
function getGraphBuilder(userId, db, apiKey) {
    return getOrCreateSession(userId, db, apiKey).builder;
}
function getGraphRetriever(userId, db, apiKey) {
    return getOrCreateSession(userId, db, apiKey).retriever;
}
function getGraphSearch(userId, db, apiKey) {
    return getOrCreateSession(userId, db, apiKey).search;
}
function getGraphIndexer(userId, db, apiKey) {
    return getOrCreateSession(userId, db, apiKey).indexer;
}
function getMemoryValidator(userId, db, apiKey) {
    return getOrCreateSession(userId, db, apiKey).validator;
}
function getMemoryAnalytics(userId, db, apiKey) {
    return getOrCreateSession(userId, db, apiKey).analytics;
}
function getRelationshipEngine(userId, db, apiKey) {
    return getOrCreateSession(userId, db, apiKey).relationshipEngine;
}
function getMemoryVersioning(userId, db, apiKey) {
    return getOrCreateSession(userId, db, apiKey).versioning;
}
/** High-level: search the memory graph and return compressed context for Claude. */
async function retrieveMemoryContext(userId, db, apiKey, query, mode = 'hybrid') {
    const retriever = getGraphRetriever(userId, db, apiKey);
    const result = await retriever.retrieve({ query, mode, userId, includeEdges: true });
    return result.compressedContext;
}
/** High-level: get graph statistics for a user. */
async function getGraphStats(userId, db, apiKey) {
    return getMemoryAnalytics(userId, db, apiKey).computeStats();
}
//# sourceMappingURL=index.js.map