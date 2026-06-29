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
const dateTimeResolver_1 = require("./tools/dateTimeResolver");
const toolDefinitions_1 = require("./tools/toolDefinitions");
const action_engine_1 = require("./action-engine");
const intelligence_1 = require("./intelligence");
const plugins_1 = require("./plugins");
const anthropicApiKey = (0, params_1.defineSecret)('ANTHROPIC_API_KEY');
const MAX_HISTORY = 20;
exports.chatWithAria = (0, https_1.onCall)({ secrets: [anthropicApiKey], timeoutSeconds: 90, memory: '512MiB' }, async (request) => {
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
    // Fallback display name from auth token (Intelligence Pipeline may override with profile)
    const authDisplayName = request.auth.token?.name;
    const trimmedHistory = history.slice(-MAX_HISTORY);
    // ── Intelligence Pipeline ─────────────────────────────────────────────────
    // Builds system prompt with context + memory + recommendations.
    // Replaces manual profile + contact context loading from previous phases.
    const systemBase = (0, ariaSystem_1.buildAriaSystemPrompt)(undefined, authDisplayName);
    let systemPrompt = systemBase;
    let userDisplayName = authDisplayName;
    let intelligenceMetrics = {};
    try {
        const pipeline = await (0, intelligence_1.runIntelligencePipeline)({
            userId,
            db,
            message,
            history: trimmedHistory,
            systemBase,
        });
        systemPrompt = pipeline.assembledSystemPrompt;
        userDisplayName = pipeline.context.userDisplayName ?? authDisplayName;
        intelligenceMetrics = {
            execMs: pipeline.metrics.executionTimeMs,
            cacheHits: pipeline.metrics.cacheHits,
            memBlocks: pipeline.metrics.memoryBlocksUsed,
            promptChars: pipeline.metrics.promptSizeChars,
            decisions: pipeline.metrics.decisionCount,
        };
    }
    catch {
        // Non-fatal — fall back to base system prompt, log metrics as empty
    }
    const apiKey = anthropicApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'AI service not configured.');
    }
    const anthropic = new sdk_1.default({ apiKey });
    const claudeMessages = [
        ...trimmedHistory.map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
    ];
    // Merge core ARIA tools with any plugin-contributed tools
    const pluginToolDefs = await (0, plugins_1.getPluginTools)(db, userId).catch(() => []);
    const allTools = [
        ...toolDefinitions_1.ARIA_TOOLS,
        ...pluginToolDefs.map((pt) => ({
            name: pt.name,
            description: pt.description,
            input_schema: pt.inputSchema,
        })),
    ];
    // First Claude call — include tools so Claude can detect intent
    const firstResponse = await anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        system: systemPrompt,
        tools: allTools,
        messages: claudeMessages,
    });
    let reply;
    const actionResults = [];
    if (firstResponse.stop_reason === 'tool_use') {
        const toolUseBlock = firstResponse.content.find((b) => b.type === 'tool_use');
        const isPluginTool = pluginToolDefs.some((pt) => pt.name === toolUseBlock?.name);
        if (toolUseBlock && isPluginTool) {
            const pluginResult = await (0, plugins_1.executePluginTool)(toolUseBlock.name, toolUseBlock.input, userId, db);
            const toolResultContent = JSON.stringify(pluginResult);
            actionResults.push({ name: toolUseBlock.name, success: pluginResult.success, actionId: toolUseBlock.id, message: pluginResult.error ?? 'Plugin tool executed' });
            const secondResponse = await anthropic.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 512,
                system: systemPrompt,
                messages: [
                    ...claudeMessages,
                    { role: 'assistant', content: firstResponse.content },
                    { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUseBlock.id, content: toolResultContent }] },
                ],
            });
            reply = secondResponse.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
        }
        else if (toolUseBlock && (0, toolDefinitions_1.isAriaTool)(toolUseBlock.name)) {
            const toolArgs = toolUseBlock.input;
            // Validate datetime fields before passing to Action Engine
            let validationError = null;
            if (typeof toolArgs.scheduledAt === 'string') {
                validationError = (0, dateTimeResolver_1.validateISODatetime)(toolArgs.scheduledAt);
            }
            else if (typeof toolArgs.dueAt === 'string') {
                validationError = (0, dateTimeResolver_1.validateISODatetime)(toolArgs.dueAt);
            }
            let toolResultContent;
            if (validationError) {
                toolResultContent = JSON.stringify({ error: validationError });
                actionResults.push({
                    name: toolUseBlock.name,
                    success: false,
                    actionId: toolUseBlock.id,
                    message: validationError,
                });
            }
            else {
                const actionResult = await action_engine_1.ActionEngine.run({
                    toolName: toolUseBlock.name,
                    args: toolArgs,
                    userId,
                    userDisplayName,
                    db,
                });
                toolResultContent = JSON.stringify({
                    success: actionResult.success,
                    message: actionResult.message,
                    data: actionResult.data,
                });
                actionResults.push({
                    name: toolUseBlock.name,
                    success: actionResult.success,
                    actionId: actionResult.actionId,
                    message: actionResult.message,
                });
            }
            // Second Claude call with tool_result — get the final user-facing reply
            const secondResponse = await anthropic.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 512,
                system: systemPrompt,
                messages: [
                    ...claudeMessages,
                    { role: 'assistant', content: firstResponse.content },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'tool_result',
                                tool_use_id: toolUseBlock.id,
                                content: toolResultContent,
                            },
                        ],
                    },
                ],
            });
            reply = secondResponse.content
                .filter((b) => b.type === 'text')
                .map((b) => b.text)
                .join('');
        }
        else {
            // Unrecognised tool — fall back to any text in the response
            reply = firstResponse.content
                .filter((b) => b.type === 'text')
                .map((b) => b.text)
                .join('');
        }
    }
    else {
        // Normal conversational response — no tool call needed
        reply = firstResponse.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('');
    }
    // Persist messages via admin SDK (bypasses Firestore rules that block client writes)
    const batch = db.batch();
    const sessionRef = db
        .collection('users')
        .doc(userId)
        .collection('chatSessions')
        .doc(sessionId);
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
    const ariaMsgDoc = {
        role: 'assistant',
        content: reply,
        timestamp: admin.firestore.Timestamp.fromMillis(now.toMillis() + 1),
        sessionId,
        userId,
    };
    if (actionResults.length > 0) {
        ariaMsgDoc.toolUsed = true;
        ariaMsgDoc.tools = actionResults;
    }
    batch.set(ariaMsgRef, ariaMsgDoc);
    batch.set(sessionRef, {
        userId,
        updatedAt: now,
        lastMessage: reply.slice(0, 120),
        messageCount: admin.firestore.FieldValue.increment(2),
        ...(Object.keys(intelligenceMetrics).length > 0 && { lastIntelligenceMetrics: intelligenceMetrics }),
    }, { merge: true });
    await batch.commit();
    const response = {
        reply,
        sessionId,
        messageId: ariaMsgRef.id,
    };
    if (actionResults.length > 0) {
        response.actionResults = actionResults;
    }
    return response;
});
//# sourceMappingURL=chat.js.map