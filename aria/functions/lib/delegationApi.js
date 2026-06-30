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
exports.runApprovalScheduledChecks = exports.listApprovalHistory = exports.listApprovalTemplates = exports.getApprovalPolicyBands = exports.getApprovalMetrics = exports.getApprovalStats = exports.rollbackApprovalRequest = exports.bulkRejectRequests = exports.bulkApproveRequests = exports.delegateRequest = exports.cancelRequest = exports.rejectRequest = exports.approveRequest = exports.listRejectedApprovals = exports.listDelegatedApprovals = exports.listExecutedApprovals = exports.listExpiredApprovals = exports.listUrgentApprovals = exports.listPendingApprovals = exports.listApprovalRequests = exports.getApprovalRequest = exports.createApprovalRequest = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const delegation_1 = require("./delegation");
function db() {
    return admin.firestore();
}
function apiKey() {
    return process.env.ANTHROPIC_API_KEY ?? '';
}
// ── Creation ──────────────────────────────────────────────────────────────────
exports.createApprovalRequest = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const data = request.data;
    if (!data?.title || !data?.triggerType || !data?.riskFactors) {
        throw new https_1.HttpsError('invalid-argument', 'title, triggerType, and riskFactors are required');
    }
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.createApprovalRequest(request.auth.uid, { ...data, createdBy: request.auth.uid });
});
exports.getApprovalRequest = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId } = request.data;
    if (!requestId)
        throw new https_1.HttpsError('invalid-argument', 'requestId required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.getApprovalRequest(request.auth.uid, requestId);
});
exports.listApprovalRequests = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.listAll(request.auth.uid, opts);
});
exports.listPendingApprovals = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.listPending(request.auth.uid);
});
exports.listUrgentApprovals = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.listUrgent(request.auth.uid);
});
exports.listExpiredApprovals = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.listExpired(request.auth.uid);
});
exports.listExecutedApprovals = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.listExecuted(request.auth.uid);
});
exports.listDelegatedApprovals = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.listDelegated(request.auth.uid);
});
exports.listRejectedApprovals = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.listRejected(request.auth.uid);
});
// ── Decisions ─────────────────────────────────────────────────────────────────
exports.approveRequest = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId } = request.data;
    if (!requestId)
        throw new https_1.HttpsError('invalid-argument', 'requestId required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.approveRequest(request.auth.uid, requestId, request.auth.uid);
});
exports.rejectRequest = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId, reason } = request.data;
    if (!requestId)
        throw new https_1.HttpsError('invalid-argument', 'requestId required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.rejectRequest(request.auth.uid, requestId, request.auth.uid, reason);
});
exports.cancelRequest = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId, reason } = request.data;
    if (!requestId)
        throw new https_1.HttpsError('invalid-argument', 'requestId required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.cancelRequest(request.auth.uid, requestId, request.auth.uid, reason);
});
exports.delegateRequest = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId, delegatedTo } = request.data;
    if (!requestId || !delegatedTo)
        throw new https_1.HttpsError('invalid-argument', 'requestId and delegatedTo required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.delegateRequest(request.auth.uid, requestId, delegatedTo, request.auth.uid);
});
exports.bulkApproveRequests = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestIds } = request.data;
    if (!requestIds?.length)
        throw new https_1.HttpsError('invalid-argument', 'requestIds required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.bulkApprove(request.auth.uid, requestIds, request.auth.uid);
});
exports.bulkRejectRequests = (0, https_1.onCall)({ timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestIds, reason } = request.data;
    if (!requestIds?.length)
        throw new https_1.HttpsError('invalid-argument', 'requestIds required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.bulkReject(request.auth.uid, requestIds, request.auth.uid, reason);
});
exports.rollbackApprovalRequest = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId } = request.data;
    if (!requestId)
        throw new https_1.HttpsError('invalid-argument', 'requestId required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.rollbackRequest(request.auth.uid, requestId, request.auth.uid);
});
// ── Stats / Metrics / Policy ───────────────────────────────────────────────────
exports.getApprovalStats = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.getStats(request.auth.uid);
});
exports.getApprovalMetrics = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.getMetrics(request.auth.uid);
});
exports.getApprovalPolicyBands = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.getPolicyBands();
});
exports.listApprovalTemplates = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.listTemplates();
});
// ── History / Scheduler ─────────────────────────────────────────────────────
exports.listApprovalHistory = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId } = (request.data ?? {});
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.listHistory(request.auth.uid, requestId);
});
exports.runApprovalScheduledChecks = (0, https_1.onCall)({ timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, delegation_1.getApprovalEngine)(request.auth.uid, db(), apiKey());
    return engine.runScheduledChecks(request.auth.uid);
});
//# sourceMappingURL=delegationApi.js.map