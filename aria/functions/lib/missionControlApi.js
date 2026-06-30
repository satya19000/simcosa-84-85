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
exports.listMissionHistory = exports.getMissionStats = exports.runMissionPlanningCycle = exports.getMissionLearningSnapshots = exports.getMissionPredictions = exports.dismissMissionRecommendation = exports.acceptMissionRecommendation = exports.listMissionRecommendations = exports.getMissionTaskApprovalStatus = exports.requestMissionTaskApproval = exports.setMissionTaskStatus = exports.completeMissionTask = exports.addMissionTask = exports.listMissionTasks = exports.abandonMission = exports.pauseMission = exports.activateMission = exports.updateMission = exports.listMissions = exports.getMission = exports.createMission = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const mission_control_1 = require("./mission-control");
const finance_1 = require("./finance");
const health_1 = require("./health");
const delegation_1 = require("./delegation");
const MissionValidator_1 = require("./mission-control/MissionValidator");
function db() {
    return admin.firestore();
}
function apiKey() {
    return process.env.ANTHROPIC_API_KEY ?? '';
}
function requireAuth(request) {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    return request.auth.uid;
}
function wrapValidation(fn) {
    try {
        return fn();
    }
    catch (err) {
        if (err instanceof MissionValidator_1.MissionValidationError)
            throw new https_1.HttpsError('invalid-argument', err.message);
        throw err;
    }
}
// ── Missions ──────────────────────────────────────────────────────────────────
exports.createMission = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    wrapValidation(() => MissionValidator_1.MissionValidator.validateCreateMission(data));
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.createMission(uid, {
        title: data.title,
        description: data.description ?? '',
        domain: data.domain ?? 'general',
        priority: data.priority ?? 'medium',
        targetDate: data.targetDate,
    }, data.plan);
});
exports.getMission = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { missionId } = request.data;
    if (!missionId)
        throw new https_1.HttpsError('invalid-argument', 'missionId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.getMission(uid, missionId);
});
exports.listMissions = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const opts = (request.data ?? {});
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.listMissions(uid, opts);
});
exports.updateMission = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { missionId, ...fields } = request.data;
    if (!missionId)
        throw new https_1.HttpsError('invalid-argument', 'missionId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.updateMission(uid, missionId, fields);
});
exports.activateMission = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { missionId } = request.data;
    if (!missionId)
        throw new https_1.HttpsError('invalid-argument', 'missionId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.activateMission(uid, missionId);
});
exports.pauseMission = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { missionId } = request.data;
    if (!missionId)
        throw new https_1.HttpsError('invalid-argument', 'missionId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.pauseMission(uid, missionId);
});
exports.abandonMission = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { missionId, reason } = request.data;
    if (!missionId)
        throw new https_1.HttpsError('invalid-argument', 'missionId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.abandonMission(uid, missionId, reason);
});
// ── Tasks ─────────────────────────────────────────────────────────────────────
exports.listMissionTasks = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { missionId } = request.data;
    if (!missionId)
        throw new https_1.HttpsError('invalid-argument', 'missionId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.listTasks(uid, missionId);
});
exports.addMissionTask = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    wrapValidation(() => MissionValidator_1.MissionValidator.validateCreateTask(data));
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.addTask(uid, data.missionId, data);
});
exports.completeMissionTask = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { taskId } = request.data;
    if (!taskId)
        throw new https_1.HttpsError('invalid-argument', 'taskId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    try {
        return await engine.completeTask(uid, taskId);
    }
    catch (err) {
        throw new https_1.HttpsError('failed-precondition', err instanceof Error ? err.message : 'Cannot complete task');
    }
});
exports.setMissionTaskStatus = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { taskId, status } = request.data;
    if (!taskId || !status)
        throw new https_1.HttpsError('invalid-argument', 'taskId and status required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.setTaskStatus(uid, taskId, status);
});
// ── Approval Bridge ───────────────────────────────────────────────────────────
exports.requestMissionTaskApproval = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    if (!data?.taskId || !data?.title || !data?.triggerType || !data?.riskFactors) {
        throw new https_1.HttpsError('invalid-argument', 'taskId, title, triggerType, and riskFactors are required');
    }
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    const { taskId, ...approvalInput } = data;
    return engine.requestTaskApproval(uid, taskId, approvalInput);
});
exports.getMissionTaskApprovalStatus = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { taskId } = request.data;
    if (!taskId)
        throw new https_1.HttpsError('invalid-argument', 'taskId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.getTaskApprovalStatus(uid, taskId);
});
// ── Recommendations ───────────────────────────────────────────────────────────
exports.listMissionRecommendations = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { minConfidence } = (request.data ?? {});
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.listRecommendations(uid, minConfidence);
});
exports.acceptMissionRecommendation = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { recommendationId, missionId } = request.data;
    if (!recommendationId || !missionId)
        throw new https_1.HttpsError('invalid-argument', 'recommendationId and missionId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.acceptRecommendation(uid, recommendationId, missionId);
});
exports.dismissMissionRecommendation = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { recommendationId } = request.data;
    if (!recommendationId)
        throw new https_1.HttpsError('invalid-argument', 'recommendationId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.dismissRecommendation(uid, recommendationId);
});
// ── Predictions ────────────────────────────────────────────────────────────────
exports.getMissionPredictions = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { missionId } = request.data;
    if (!missionId)
        throw new https_1.HttpsError('invalid-argument', 'missionId required');
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.getPredictionsForMission(uid, missionId);
});
// ── Learning ──────────────────────────────────────────────────────────────────
exports.getMissionLearningSnapshots = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { sourceDomain } = (request.data ?? {});
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return sourceDomain ? [await engine.getLearningSnapshot(uid, sourceDomain)] : engine.getAllLearningSnapshots(uid);
});
// ── Continuous Planning ───────────────────────────────────────────────────────
exports.runMissionPlanningCycle = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    const uid = requireAuth(request);
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.runPlanningCycle(uid, {
        finance: (0, finance_1.getFinanceEngine)(uid, db(), apiKey()),
        health: (0, health_1.getHealthEngine)(uid, db(), apiKey()),
        approvals: (0, delegation_1.getApprovalEngine)(uid, db(), apiKey()),
    });
});
// ── Stats / History ────────────────────────────────────────────────────────────
exports.getMissionStats = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.getStats(uid);
});
exports.listMissionHistory = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { requestId } = (request.data ?? {});
    const engine = (0, mission_control_1.getMissionEngine)(uid, db(), apiKey());
    return engine.listHistory(uid, requestId);
});
//# sourceMappingURL=missionControlApi.js.map