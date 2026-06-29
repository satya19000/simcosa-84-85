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
exports.rebuildDocumentIndex = exports.listDocumentFolders = exports.createDocumentFolder = exports.getDocumentStats = exports.deleteDocument = exports.listDocuments = exports.chatWithDocument = exports.searchDocuments = exports.ingestDocument = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const documents_1 = require("./documents");
function db() {
    return admin.firestore();
}
function apiKey() {
    return process.env.ANTHROPIC_API_KEY ?? '';
}
exports.ingestDocument = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 300, memory: '1GiB' }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { title, mimeType, sizeBytes, storageRef, rawText, filename, folderId, tags } = request.data;
    if (!title || !mimeType || !storageRef)
        throw new https_1.HttpsError('invalid-argument', 'title, mimeType, storageRef required');
    const manager = (0, documents_1.getDocumentManager)(request.auth.uid, db(), apiKey());
    return manager.ingestDocument({ userId: request.auth.uid, title, mimeType, sizeBytes: sizeBytes ?? 0, storageRef, rawText, filename, folderId, tags });
});
exports.searchDocuments = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = request.data;
    if (!opts.query)
        throw new https_1.HttpsError('invalid-argument', 'query required');
    const manager = (0, documents_1.getDocumentManager)(request.auth.uid, db(), apiKey());
    return manager.searchDocuments(request.auth.uid, opts);
});
exports.chatWithDocument = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { documentId, question } = request.data;
    if (!documentId || !question)
        throw new https_1.HttpsError('invalid-argument', 'documentId and question required');
    const manager = (0, documents_1.getDocumentManager)(request.auth.uid, db(), apiKey());
    const answer = await manager.chatWithDocument(request.auth.uid, documentId, question);
    return { answer };
});
exports.listDocuments = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { limit, category, format, folderId } = (request.data ?? {});
    const manager = (0, documents_1.getDocumentManager)(request.auth.uid, db(), apiKey());
    return manager.listDocuments(request.auth.uid, { limit, category: category, format: format, folderId });
});
exports.deleteDocument = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { documentId } = request.data;
    if (!documentId)
        throw new https_1.HttpsError('invalid-argument', 'documentId required');
    const manager = (0, documents_1.getDocumentManager)(request.auth.uid, db(), apiKey());
    await manager.deleteDocument(request.auth.uid, documentId);
    return { success: true };
});
exports.getDocumentStats = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const manager = (0, documents_1.getDocumentManager)(request.auth.uid, db(), apiKey());
    return manager.getStats(request.auth.uid);
});
exports.createDocumentFolder = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { name, parentId, color } = request.data;
    if (!name)
        throw new https_1.HttpsError('invalid-argument', 'name required');
    const manager = (0, documents_1.getDocumentManager)(request.auth.uid, db(), apiKey());
    return manager.createFolder(request.auth.uid, name, parentId, color);
});
exports.listDocumentFolders = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const manager = (0, documents_1.getDocumentManager)(request.auth.uid, db(), apiKey());
    return manager.listFolders(request.auth.uid);
});
exports.rebuildDocumentIndex = (0, https_1.onCall)({ timeoutSeconds: 120 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const manager = (0, documents_1.getDocumentManager)(request.auth.uid, db(), apiKey());
    await manager.rebuildIndex(request.auth.uid);
    return { success: true };
});
//# sourceMappingURL=documentApi.js.map