"use strict";
/**
 * meetingAgentApi.ts — Cloud Functions for the Meeting Agent module.
 *
 * All functions verify request.auth + TenantEngine.requireIdentity
 * (the latter is enforced inside MeetingAgentEngine methods).
 *
 * Pattern mirrors computerControlApi.ts exactly.
 */
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
exports.exportMeetingNotes = exports.approveMeetingFollowUp = exports.extractMeetingActionItems = exports.getMeetingSummary = exports.generateMeetingSummary = exports.addTranscriptChunk = exports.listMeetingSessions = exports.deleteMeetingSession = exports.endMeetingSession = exports.pauseMeetingSession = exports.startMeetingSession = exports.createMeetingSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const meeting_agent_1 = require("./meeting-agent");
const delegation_1 = require("./delegation");
const ai_gateway_1 = require("./ai-gateway");
const TenantEngine_1 = require("./security/TenantEngine");
const SHARED_OPTS = {
    secrets: ['ANTHROPIC_API_KEY'],
    timeoutSeconds: 60,
};
function db() {
    return admin.firestore();
}
function apiKey() {
    return process.env.ANTHROPIC_API_KEY ?? '';
}
function requireAuth(request) {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required.');
    return request.auth.uid;
}
function wrapError(fn) {
    return fn().catch((err) => {
        const message = err instanceof Error ? err.message : 'Operation failed';
        if (message.includes('Access denied') || message.includes('no identity')) {
            throw new https_1.HttpsError('permission-denied', message);
        }
        if (message.includes('STEALTH_RECORDING_BLOCKED') ||
            message.includes('HIDDEN_MICROPHONE_BLOCKED') ||
            message.includes('BACKGROUND_LISTENING_BLOCKED') ||
            message.includes('AUTO_SEND_BLOCKED') ||
            message.includes('APPROVAL_BYPASS_BLOCKED')) {
            throw new https_1.HttpsError('permission-denied', message);
        }
        throw new https_1.HttpsError('failed-precondition', message);
    });
}
function getMeetingEngine(uid) {
    const firestore = db();
    const key = apiKey();
    const tenants = new TenantEngine_1.TenantEngine(firestore);
    const approvalEngine = (0, delegation_1.getApprovalEngine)(uid, firestore, key);
    const aiGateway = (0, ai_gateway_1.getAIGateway)(uid, firestore, { anthropicApiKey: key, openaiApiKey: '', geminiApiKey: '', openrouterApiKey: '', localLlmEndpoint: null });
    return (0, meeting_agent_1.getMeetingAgentEngine)(uid, firestore, tenants, approvalEngine, aiGateway, key);
}
// ── Session management ────────────────────────────────────────────────────
exports.createMeetingSession = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, title, type, language, location, platform, tags, notes } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!title?.trim())
        throw new https_1.HttpsError('invalid-argument', 'title required');
    if (!type)
        throw new https_1.HttpsError('invalid-argument', 'type required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.createSession(uid, { tenantId, title, type, language, location, platform, tags, notes }));
});
exports.startMeetingSession = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'sessionId required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.startSession(uid, tenantId, sessionId));
});
exports.pauseMeetingSession = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'sessionId required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.pauseSession(uid, tenantId, sessionId));
});
exports.endMeetingSession = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'sessionId required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.endSession(uid, tenantId, sessionId));
});
exports.deleteMeetingSession = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'sessionId required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.deleteSession(uid, tenantId, sessionId));
});
exports.listMeetingSessions = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, limit } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.listSessions(uid, tenantId, limit));
});
// ── Transcription ─────────────────────────────────────────────────────────
exports.addTranscriptChunk = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId, text, chunkIndex, speakerLabel, startMs, endMs, confidence, language } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'sessionId required');
    if (!text?.trim())
        throw new https_1.HttpsError('invalid-argument', 'text required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.addTranscriptChunk(uid, { tenantId, sessionId, text, chunkIndex, speakerLabel, startMs, endMs, confidence, language }));
});
// ── Summary & action items ────────────────────────────────────────────────
exports.generateMeetingSummary = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'sessionId required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.generateSummary(uid, tenantId, sessionId));
});
exports.getMeetingSummary = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'sessionId required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.getMeetingSummary(uid, tenantId, sessionId));
});
exports.extractMeetingActionItems = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'sessionId required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.extractActionItems(uid, tenantId, sessionId));
});
// ── Approval & export ─────────────────────────────────────────────────────
exports.approveMeetingFollowUp = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId, followUpId } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'sessionId required');
    if (!followUpId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'followUpId required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.approveMeetingFollowUp(uid, tenantId, sessionId, followUpId));
});
exports.exportMeetingNotes = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId, format } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!sessionId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'sessionId required');
    if (!format)
        throw new https_1.HttpsError('invalid-argument', 'format required');
    const engine = getMeetingEngine(uid);
    return wrapError(() => engine.exportMeetingNotes(uid, tenantId, sessionId, format));
});
//# sourceMappingURL=meetingAgentApi.js.map