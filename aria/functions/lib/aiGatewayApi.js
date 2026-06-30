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
exports.chatWithAriaGateway = exports.updateModelPolicy = exports.getAIUsage = exports.testAIProvider = exports.listAIModels = exports.listAIProviders = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const ai_gateway_1 = require("./ai-gateway");
const ModelFallbackManager_1 = require("./ai-gateway/ModelFallbackManager");
const ariaSystem_1 = require("./prompts/ariaSystem");
const MAX_HISTORY = 20;
function db() {
    return admin.firestore();
}
function apiKeys() {
    return {
        anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
        openaiApiKey: process.env.OPENAI_API_KEY ?? '',
        geminiApiKey: process.env.GEMINI_API_KEY ?? '',
        openrouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
        localLlmEndpoint: process.env.LOCAL_LLM_ENDPOINT ?? null,
    };
}
function requireAuth(request) {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    return request.auth.uid;
}
function wrapEngineError(fn) {
    return fn().catch((err) => {
        if (err instanceof ModelFallbackManager_1.GatewayUserFacingError)
            throw new https_1.HttpsError('unavailable', err.message);
        const message = err instanceof Error ? err.message : 'Operation failed';
        if (message.includes('Access denied'))
            throw new https_1.HttpsError('permission-denied', message);
        if (message.includes('No eligible model'))
            throw new https_1.HttpsError('failed-precondition', 'No AI model is currently eligible for this request under the active policy/constraints.');
        throw new https_1.HttpsError('failed-precondition', message);
    });
}
const SHARED_OPTS = {
    secrets: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'OPENROUTER_API_KEY'],
    timeoutSeconds: 30,
};
// ── Discovery ────────────────────────────────────────────────────────────
exports.listAIProviders = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const gateway = (0, ai_gateway_1.getAIGateway)(uid, db(), apiKeys());
    return gateway.listProviders();
});
exports.listAIModels = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const gateway = (0, ai_gateway_1.getAIGateway)(uid, db(), apiKeys());
    return gateway.listModels();
});
exports.testAIProvider = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, providerId } = request.data;
    if (!tenantId || !providerId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and providerId required');
    const gateway = (0, ai_gateway_1.getAIGateway)(uid, db(), apiKeys());
    return wrapEngineError(() => gateway.testProvider(tenantId, uid, providerId));
});
// ── Usage / policy ───────────────────────────────────────────────────────
exports.getAIUsage = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, limit } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const gateway = (0, ai_gateway_1.getAIGateway)(uid, db(), apiKeys());
    return wrapEngineError(() => gateway.getUsage(tenantId, uid, limit));
});
exports.updateModelPolicy = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, ...fields } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const gateway = (0, ai_gateway_1.getAIGateway)(uid, db(), apiKeys());
    return wrapEngineError(() => gateway.updatePolicy(tenantId, uid, fields));
});
/**
 * Parallel, gateway-routed chat callable. Does NOT replace chatWithAria —
 * see chat.ts, which is untouched. This function exists so the Multi-LLM
 * Gateway can be exercised end-to-end (routing, fallback, usage tracking,
 * policy) without risking the existing Claude chat path. No Action Engine
 * tool-calling integration here yet (forward-compatible plumbing only, per
 * the phase 5.4 scope) — plain conversational completion.
 */
exports.chatWithAriaGateway = (0, https_1.onCall)({ ...SHARED_OPTS, timeoutSeconds: 90, memory: '512MiB' }, async (request) => {
    const uid = requireAuth(request);
    const { message, sessionId, tenantId, history = [], taskType, preferredProvider, preferredModel } = request.data;
    if (!message?.trim())
        throw new https_1.HttpsError('invalid-argument', 'Message is required.');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'Session ID is required.');
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId is required.');
    const gateway = (0, ai_gateway_1.getAIGateway)(uid, db(), apiKeys());
    if (!gateway.effectiveConfig.enableAIGateway) {
        throw new https_1.HttpsError('failed-precondition', 'AI Gateway routing is disabled (enableAIGateway=false). Use chatWithAria for the standard Claude chat path.');
    }
    const authDisplayName = request.auth?.token?.name;
    const systemPrompt = (0, ariaSystem_1.buildAriaSystemPrompt)(undefined, authDisplayName);
    const trimmedHistory = history.slice(-MAX_HISTORY);
    const result = await wrapEngineError(() => gateway.complete({
        tenantId,
        userId: uid,
        taskType: taskType ?? 'chat',
        systemPrompt,
        history: trimmedHistory,
        userMessage: message,
        preferredProvider: preferredProvider ?? null,
        preferredModel: preferredModel ?? null,
    }));
    return {
        reply: result.text,
        sessionId,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        finishReason: result.finishReason,
    };
});
//# sourceMappingURL=aiGatewayApi.js.map