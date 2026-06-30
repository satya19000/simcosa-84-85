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
exports.listScheduledMessages = exports.scheduleCommunicationMessage = exports.listCommunicationTemplates = exports.createCommunicationTemplate = exports.getCommunicationStats = exports.searchCommunications = exports.generateAIReply = exports.generateConversationSummary = exports.analyzeConversationThread = exports.archiveConversationThread = exports.markThreadRead = exports.getConversationMessages = exports.listConversationThreads = exports.syncCommunicationProvider = exports.sendCommunicationMessage = exports.ingestCommunicationMessage = exports.listCommunicationProviders = exports.getProviderHealth = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const communication_1 = require("./communication");
function db() {
    return admin.firestore();
}
function apiKey() {
    return process.env.ANTHROPIC_API_KEY ?? '';
}
// ── Provider Health ───────────────────────────────────────────────────────────
exports.getProviderHealth = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.healthCheckAll(request.auth.uid);
});
exports.listCommunicationProviders = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.listProviders();
});
// ── Message Operations ────────────────────────────────────────────────────────
exports.ingestCommunicationMessage = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const message = request.data;
    if (!message.providerId || !message.body)
        throw new https_1.HttpsError('invalid-argument', 'providerId and body required');
    message.userId = request.auth.uid;
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.ingestMessage(request.auth.uid, message);
});
exports.sendCommunicationMessage = (0, https_1.onCall)({ timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { providerId, opts } = request.data;
    if (!providerId || !opts?.body)
        throw new https_1.HttpsError('invalid-argument', 'providerId and opts.body required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.sendMessage(request.auth.uid, providerId, opts);
});
exports.syncCommunicationProvider = (0, https_1.onCall)({ timeoutSeconds: 120 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { providerId } = request.data;
    if (!providerId)
        throw new https_1.HttpsError('invalid-argument', 'providerId required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    const count = await engine.syncProvider(request.auth.uid, providerId);
    return { synced: count };
});
// ── Thread Operations ────────────────────────────────────────────────────────
exports.listConversationThreads = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { limit, providerType, status } = (request.data ?? {});
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.listThreads(request.auth.uid, { limit, providerType: providerType, status });
});
exports.getConversationMessages = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { threadId, limit } = request.data;
    if (!threadId)
        throw new https_1.HttpsError('invalid-argument', 'threadId required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.getMessages(request.auth.uid, threadId, limit);
});
exports.markThreadRead = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { threadId } = request.data;
    if (!threadId)
        throw new https_1.HttpsError('invalid-argument', 'threadId required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    await engine.markRead(request.auth.uid, threadId);
    return { success: true };
});
exports.archiveConversationThread = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { threadId } = request.data;
    if (!threadId)
        throw new https_1.HttpsError('invalid-argument', 'threadId required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    await engine.archiveThread(request.auth.uid, threadId);
    return { success: true };
});
// ── Intelligence ─────────────────────────────────────────────────────────────
exports.analyzeConversationThread = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { threadId } = request.data;
    if (!threadId)
        throw new https_1.HttpsError('invalid-argument', 'threadId required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.analyzeThread(request.auth.uid, threadId);
});
exports.generateConversationSummary = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { threadId, type } = request.data;
    if (!threadId)
        throw new https_1.HttpsError('invalid-argument', 'threadId required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.generateSummary(request.auth.uid, threadId, type);
});
exports.generateAIReply = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { messageId, tone } = request.data;
    if (!messageId || !tone)
        throw new https_1.HttpsError('invalid-argument', 'messageId and tone required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.generateReply(request.auth.uid, messageId, tone);
});
// ── Search ────────────────────────────────────────────────────────────────────
exports.searchCommunications = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = request.data;
    if (!opts?.query)
        throw new https_1.HttpsError('invalid-argument', 'query required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.search(request.auth.uid, opts);
});
// ── Analytics ─────────────────────────────────────────────────────────────────
exports.getCommunicationStats = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.getStats(request.auth.uid);
});
// ── Templates ─────────────────────────────────────────────────────────────────
exports.createCommunicationTemplate = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.name || !fields?.body)
        throw new https_1.HttpsError('invalid-argument', 'name and body required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.createTemplate(request.auth.uid, fields);
});
exports.listCommunicationTemplates = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { providerType } = (request.data ?? {});
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.listTemplates(request.auth.uid, providerType);
});
// ── Scheduler ─────────────────────────────────────────────────────────────────
exports.scheduleCommunicationMessage = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.providerId || !fields?.body || !fields?.scheduledFor) {
        throw new https_1.HttpsError('invalid-argument', 'providerId, body, scheduledFor required');
    }
    fields.userId = request.auth.uid;
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.scheduleMessage(request.auth.uid, fields);
});
exports.listScheduledMessages = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, communication_1.getCommunicationEngine)(request.auth.uid, db(), apiKey());
    return engine.listScheduledMessages(request.auth.uid);
});
//# sourceMappingURL=communicationApi.js.map