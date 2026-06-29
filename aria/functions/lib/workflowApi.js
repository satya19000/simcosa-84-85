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
exports.setWorkflowEnabledFn = exports.getWorkflowSchedulesFn = exports.listWorkflowsFn = exports.getWorkflowHistoryFn = exports.runWorkflowFn = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const workflows_1 = require("./workflows");
const anthropicApiKey = (0, params_1.defineSecret)('ANTHROPIC_API_KEY');
function requireAuth(request) {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in');
    return request.auth.uid;
}
exports.runWorkflowFn = (0, https_1.onCall)({ secrets: [anthropicApiKey], timeoutSeconds: 300, memory: '512MiB' }, async (request) => {
    const userId = requireAuth(request);
    const { workflowId, triggerData } = request.data;
    if (!workflowId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'workflowId is required');
    const db = admin.firestore();
    const apiKey = anthropicApiKey.value();
    const displayName = request.auth?.token?.name;
    const result = await (0, workflows_1.runWorkflow)(workflowId, userId, db, apiKey, triggerData, displayName);
    return result;
});
exports.getWorkflowHistoryFn = (0, https_1.onCall)({ secrets: [] }, async (request) => {
    const userId = requireAuth(request);
    const { workflowId, limit } = request.data;
    const db = admin.firestore();
    return (0, workflows_1.getWorkflowHistory)(userId, db, workflowId, limit);
});
exports.listWorkflowsFn = (0, https_1.onCall)({ secrets: [] }, async (request) => {
    requireAuth(request);
    const all = (0, workflows_1.listWorkflows)();
    return { workflows: all.map((w) => ({
            id: w.id,
            name: w.name,
            description: w.description,
            version: w.version,
            trigger: w.trigger,
            enabled: w.enabled,
            tags: w.tags ?? [],
            stepCount: w.steps.length,
        })) };
});
exports.getWorkflowSchedulesFn = (0, https_1.onCall)({ secrets: [] }, async (request) => {
    const userId = requireAuth(request);
    const db = admin.firestore();
    return { schedules: await (0, workflows_1.getScheduledWorkflows)(userId, db) };
});
exports.setWorkflowEnabledFn = (0, https_1.onCall)({ secrets: [] }, async (request) => {
    requireAuth(request);
    const { workflowId, enabled } = request.data;
    if (!workflowId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'workflowId is required');
    workflows_1.workflowRegistry.setEnabled(workflowId, enabled);
    return { workflowId, enabled };
});
//# sourceMappingURL=workflowApi.js.map