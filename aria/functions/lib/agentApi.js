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
exports.getAgentStatus = exports.runAgentGraph = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const agents_1 = require("./agents");
const uuid_1 = require("uuid");
exports.runAgentGraph = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 300 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const data = request.data;
    if (!data.tasks || data.tasks.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'tasks is required and must not be empty');
    }
    const db = admin.firestore();
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    const graphRunId = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    const tasks = data.tasks.map((t, i) => ({
        ...t,
        taskId: t.taskId ?? `${graphRunId}-t${i + 1}`,
        graphRunId,
        userId: uid,
        status: 'pending',
        createdAt: now,
        attempts: 0,
        dependsOn: t.dependsOn ?? [],
        priority: t.priority ?? 50,
    }));
    const { orchestrator, scheduler } = await (0, agents_1.bootstrap)();
    // Fire scheduled jobs opportunistically
    await scheduler.tick();
    const baseContext = {
        userId: uid,
        userDisplayName: request.auth?.token?.['name'],
        db,
        apiKey,
        sharedVars: data.sharedVars ?? {},
        createdAt: now,
    };
    const result = await orchestrator.run({
        graphRunId,
        userId: uid,
        userDisplayName: baseContext.userDisplayName,
        tasks,
        baseContext,
    });
    return result;
});
exports.getAgentStatus = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth?.uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    const { manager } = await (0, agents_1.bootstrap)();
    const manifests = manager.listManifests();
    const stats = manager.stats();
    return { manifests, stats };
});
//# sourceMappingURL=agentApi.js.map