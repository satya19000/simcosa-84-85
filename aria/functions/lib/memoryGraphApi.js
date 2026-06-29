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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMemoryNodes = exports.upsertMemoryNode = exports.extractRelationships = exports.getMemoryGraphStats = exports.validateMemoryGraph = exports.rebuildMemoryIndex = exports.retrieveMemoryContext = exports.searchMemoryGraph = exports.buildMemoryFromChat = exports.buildMemoryFromReminder = exports.buildMemoryFromTask = exports.buildMemoryFromContact = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const memory_graph_1 = require("./memory-graph");
// ── Build graph from domain objects ──────────────────────────────────────────
exports.buildMemoryFromContact = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    const builder = (0, memory_graph_1.getGraphBuilder)(uid, db, apiKey);
    return builder.buildFromContact(request.data);
});
exports.buildMemoryFromTask = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    const builder = (0, memory_graph_1.getGraphBuilder)(uid, db, apiKey);
    return builder.buildFromTask(request.data);
});
exports.buildMemoryFromReminder = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    const builder = (0, memory_graph_1.getGraphBuilder)(uid, db, apiKey);
    return builder.buildFromReminder(request.data);
});
exports.buildMemoryFromChat = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    const builder = (0, memory_graph_1.getGraphBuilder)(uid, db, apiKey);
    return builder.buildFromChat(request.data);
});
// ── Search & retrieval ────────────────────────────────────────────────────────
exports.searchMemoryGraph = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const { query, mode = 'hybrid', maxNodes, nodeTypes, includeEdges } = request.data;
    if (!query)
        throw new https_1.HttpsError('invalid-argument', 'query is required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    const search = (0, memory_graph_1.getGraphSearch)(uid, db, apiKey);
    return search.search({ query, mode, maxNodes, nodeTypes, includeEdges, userId: uid });
});
exports.retrieveMemoryContext = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const { query, mode = 'hybrid' } = request.data;
    if (!query)
        throw new https_1.HttpsError('invalid-argument', 'query is required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    const retriever = (0, memory_graph_1.getGraphRetriever)(uid, db, apiKey);
    return retriever.retrieve({ query, mode, userId: uid, includeEdges: true });
});
// ── Graph management ──────────────────────────────────────────────────────────
exports.rebuildMemoryIndex = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    return (0, memory_graph_1.getGraphIndexer)(uid, db, apiKey).rebuild();
});
exports.validateMemoryGraph = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    return (0, memory_graph_1.getMemoryValidator)(uid, db, apiKey).validate();
});
exports.getMemoryGraphStats = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    const [stats, topContacts, activeProjects] = await Promise.all([
        (0, memory_graph_1.getMemoryAnalytics)(uid, db, apiKey).computeStats(),
        (0, memory_graph_1.getMemoryAnalytics)(uid, db, apiKey).computeTopContacts(),
        (0, memory_graph_1.getMemoryAnalytics)(uid, db, apiKey).computeActiveProjects(),
    ]);
    return { stats, topContacts, activeProjects };
});
exports.extractRelationships = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const { text } = request.data;
    if (!text)
        throw new https_1.HttpsError('invalid-argument', 'text is required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    return (0, memory_graph_1.getRelationshipEngine)(uid, db, apiKey).extractAndPersist(text, uid);
});
exports.upsertMemoryNode = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const { type, title, summary, metadata, importance } = request.data;
    if (!type || !title)
        throw new https_1.HttpsError('invalid-argument', 'type and title are required');
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    const graph = (0, memory_graph_1.getMemoryGraph)(uid, db, apiKey);
    return graph.upsertNode(type, title, summary ?? '', metadata ?? {}, importance ?? 50);
});
exports.listMemoryNodes = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const { limit = 100 } = request.data;
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    const graph = (0, memory_graph_1.getMemoryGraph)(uid, db, apiKey);
    return graph.listNodes(limit);
});
//# sourceMappingURL=memoryGraphApi.js.map