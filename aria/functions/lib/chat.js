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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithAria = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const ariaSystem_1 = require("./prompts/ariaSystem");
const anthropicApiKey = (0, params_1.defineSecret)('ANTHROPIC_API_KEY');
const MAX_HISTORY = 20;
exports.chatWithAria = (0, https_1.onCall)({ secrets: [anthropicApiKey], timeoutSeconds: 60, memory: '512MiB' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    const { message, sessionId, history = [] } = request.data;
    if (!message?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Message is required.');
    }
    if (!sessionId?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Session ID is required.');
    }
    const userId = request.auth.uid;
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const trimmedHistory = history.slice(-MAX_HISTORY);
    const claudeMessages = [
        ...trimmedHistory,
        { role: 'user', content: message },
    ];
    const apiKey = anthropicApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'AI service not configured.');
    }
    const anthropic = new sdk_1.default({ apiKey });
    const response = await anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        system: ariaSystem_1.ARIA_SYSTEM_PROMPT,
        messages: claudeMessages,
    });
    const reply = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');
    const batch = db.batch();
    const sessionRef = db.collection('users').doc(userId).collection('chatSessions').doc(sessionId);
    const messagesRef = sessionRef.collection('messages');
    const userMsgRef = messagesRef.doc();
    batch.set(userMsgRef, {
        role: 'user',
        content: message,
        timestamp: now,
        sessionId,
        userId,
    });
    const ariaMsgRef = messagesRef.doc();
    batch.set(ariaMsgRef, {
        role: 'assistant',
        content: reply,
        timestamp: admin.firestore.Timestamp.fromMillis(now.toMillis() + 1),
        sessionId,
        userId,
    });
    batch.set(sessionRef, {
        userId,
        updatedAt: now,
        lastMessage: reply.slice(0, 120),
        messageCount: admin.firestore.FieldValue.increment(2),
    }, { merge: true });
    await batch.commit();
    return { reply, sessionId, messageId: ariaMsgRef.id };
});
//# sourceMappingURL=chat.js.map