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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_APPROVAL_CONFIG = exports.ApprovalRequestBuilder = exports.riskScoreToLevel = exports.computeRiskScore = exports.buildApprovalRequest = exports.ApprovalWorkflow = exports.ApprovalEvents = exports.ApprovalValidator = exports.ApprovalLogger = exports.ApprovalPermissions = exports.unregisterExecutor = exports.listExecutors = exports.getExecutor = exports.registerExecutor = exports.ApprovalRegistry = exports.ApprovalScheduler = exports.ApprovalMetrics = exports.ApprovalAnalytics = exports.ApprovalNotifications = exports.registerTemplate = exports.listTemplates = exports.getTemplate = exports.ApprovalTemplates = exports.ApprovalPolicy = exports.ApprovalHistory = exports.ApprovalQueue = exports.ApprovalEngine = void 0;
exports.getApprovalEngine = getApprovalEngine;
const ApprovalEngine_1 = require("./ApprovalEngine");
const ApprovalConfig_1 = require("./ApprovalConfig");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getSession(userId, db, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const session = {
        engine: new ApprovalEngine_1.ApprovalEngine(db, ApprovalConfig_1.DEFAULT_APPROVAL_CONFIG, apiKey),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getApprovalEngine(userId, db, apiKey) {
    return getSession(userId, db, apiKey).engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────────
var ApprovalEngine_2 = require("./ApprovalEngine");
Object.defineProperty(exports, "ApprovalEngine", { enumerable: true, get: function () { return ApprovalEngine_2.ApprovalEngine; } });
var ApprovalQueue_1 = require("./ApprovalQueue");
Object.defineProperty(exports, "ApprovalQueue", { enumerable: true, get: function () { return ApprovalQueue_1.ApprovalQueue; } });
var ApprovalHistory_1 = require("./ApprovalHistory");
Object.defineProperty(exports, "ApprovalHistory", { enumerable: true, get: function () { return ApprovalHistory_1.ApprovalHistory; } });
var ApprovalPolicy_1 = require("./ApprovalPolicy");
Object.defineProperty(exports, "ApprovalPolicy", { enumerable: true, get: function () { return ApprovalPolicy_1.ApprovalPolicy; } });
var ApprovalTemplates_1 = require("./ApprovalTemplates");
Object.defineProperty(exports, "ApprovalTemplates", { enumerable: true, get: function () { return ApprovalTemplates_1.ApprovalTemplates; } });
Object.defineProperty(exports, "getTemplate", { enumerable: true, get: function () { return ApprovalTemplates_1.getTemplate; } });
Object.defineProperty(exports, "listTemplates", { enumerable: true, get: function () { return ApprovalTemplates_1.listTemplates; } });
Object.defineProperty(exports, "registerTemplate", { enumerable: true, get: function () { return ApprovalTemplates_1.registerTemplate; } });
var ApprovalNotifications_1 = require("./ApprovalNotifications");
Object.defineProperty(exports, "ApprovalNotifications", { enumerable: true, get: function () { return ApprovalNotifications_1.ApprovalNotifications; } });
var ApprovalAnalytics_1 = require("./ApprovalAnalytics");
Object.defineProperty(exports, "ApprovalAnalytics", { enumerable: true, get: function () { return ApprovalAnalytics_1.ApprovalAnalytics; } });
var ApprovalMetrics_1 = require("./ApprovalMetrics");
Object.defineProperty(exports, "ApprovalMetrics", { enumerable: true, get: function () { return ApprovalMetrics_1.ApprovalMetrics; } });
var ApprovalScheduler_1 = require("./ApprovalScheduler");
Object.defineProperty(exports, "ApprovalScheduler", { enumerable: true, get: function () { return ApprovalScheduler_1.ApprovalScheduler; } });
var ApprovalRegistry_1 = require("./ApprovalRegistry");
Object.defineProperty(exports, "ApprovalRegistry", { enumerable: true, get: function () { return ApprovalRegistry_1.ApprovalRegistry; } });
Object.defineProperty(exports, "registerExecutor", { enumerable: true, get: function () { return ApprovalRegistry_1.registerExecutor; } });
Object.defineProperty(exports, "getExecutor", { enumerable: true, get: function () { return ApprovalRegistry_1.getExecutor; } });
Object.defineProperty(exports, "listExecutors", { enumerable: true, get: function () { return ApprovalRegistry_1.listExecutors; } });
Object.defineProperty(exports, "unregisterExecutor", { enumerable: true, get: function () { return ApprovalRegistry_1.unregisterExecutor; } });
var ApprovalPermissions_1 = require("./ApprovalPermissions");
Object.defineProperty(exports, "ApprovalPermissions", { enumerable: true, get: function () { return ApprovalPermissions_1.ApprovalPermissions; } });
var ApprovalLogger_1 = require("./ApprovalLogger");
Object.defineProperty(exports, "ApprovalLogger", { enumerable: true, get: function () { return ApprovalLogger_1.ApprovalLogger; } });
var ApprovalValidator_1 = require("./ApprovalValidator");
Object.defineProperty(exports, "ApprovalValidator", { enumerable: true, get: function () { return ApprovalValidator_1.ApprovalValidator; } });
var ApprovalEvents_1 = require("./ApprovalEvents");
Object.defineProperty(exports, "ApprovalEvents", { enumerable: true, get: function () { return ApprovalEvents_1.ApprovalEvents; } });
var ApprovalWorkflow_1 = require("./ApprovalWorkflow");
Object.defineProperty(exports, "ApprovalWorkflow", { enumerable: true, get: function () { return ApprovalWorkflow_1.ApprovalWorkflow; } });
var ApprovalRequest_1 = require("./ApprovalRequest");
Object.defineProperty(exports, "buildApprovalRequest", { enumerable: true, get: function () { return ApprovalRequest_1.buildApprovalRequest; } });
Object.defineProperty(exports, "computeRiskScore", { enumerable: true, get: function () { return ApprovalRequest_1.computeRiskScore; } });
Object.defineProperty(exports, "riskScoreToLevel", { enumerable: true, get: function () { return ApprovalRequest_1.riskScoreToLevel; } });
Object.defineProperty(exports, "ApprovalRequestBuilder", { enumerable: true, get: function () { return ApprovalRequest_1.ApprovalRequestBuilder; } });
var ApprovalConfig_2 = require("./ApprovalConfig");
Object.defineProperty(exports, "DEFAULT_APPROVAL_CONFIG", { enumerable: true, get: function () { return ApprovalConfig_2.DEFAULT_APPROVAL_CONFIG; } });
__exportStar(require("./ApprovalTypes"), exports);
//# sourceMappingURL=index.js.map