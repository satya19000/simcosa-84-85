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
exports.DEFAULT_MISSION_CONFIG = exports.MissionEvents = exports.MissionValidationError = exports.MissionValidator = exports.MissionLogger = exports.MissionHistory = exports.MissionPermissions = exports.MissionApprovalBridge = exports.MissionScheduler = exports.ContinuousPlanningEngine = exports.PredictionEngine = exports.PredictionManager = exports.LearningEngine = exports.RecommendationEngine = exports.RecommendationManager = exports.MissionAnalytics = exports.MissionPlanner = exports.MissionTaskManager = exports.MissionManager = exports.MissionEngine = void 0;
exports.getMissionEngine = getMissionEngine;
const MissionEngine_1 = require("./MissionEngine");
const MissionConfig_1 = require("./MissionConfig");
const delegation_1 = require("../delegation");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getSession(userId, db, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const approvalEngine = (0, delegation_1.getApprovalEngine)(userId, db, apiKey);
    const session = {
        engine: new MissionEngine_1.MissionEngine(db, MissionConfig_1.DEFAULT_MISSION_CONFIG, apiKey, approvalEngine),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getMissionEngine(userId, db, apiKey) {
    return getSession(userId, db, apiKey).engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────────
var MissionEngine_2 = require("./MissionEngine");
Object.defineProperty(exports, "MissionEngine", { enumerable: true, get: function () { return MissionEngine_2.MissionEngine; } });
var MissionManager_1 = require("./MissionManager");
Object.defineProperty(exports, "MissionManager", { enumerable: true, get: function () { return MissionManager_1.MissionManager; } });
var MissionTaskManager_1 = require("./MissionTaskManager");
Object.defineProperty(exports, "MissionTaskManager", { enumerable: true, get: function () { return MissionTaskManager_1.MissionTaskManager; } });
var MissionPlanner_1 = require("./MissionPlanner");
Object.defineProperty(exports, "MissionPlanner", { enumerable: true, get: function () { return MissionPlanner_1.MissionPlanner; } });
var MissionAnalytics_1 = require("./MissionAnalytics");
Object.defineProperty(exports, "MissionAnalytics", { enumerable: true, get: function () { return MissionAnalytics_1.MissionAnalytics; } });
var RecommendationManager_1 = require("./RecommendationManager");
Object.defineProperty(exports, "RecommendationManager", { enumerable: true, get: function () { return RecommendationManager_1.RecommendationManager; } });
var RecommendationEngine_1 = require("./RecommendationEngine");
Object.defineProperty(exports, "RecommendationEngine", { enumerable: true, get: function () { return RecommendationEngine_1.RecommendationEngine; } });
var LearningEngine_1 = require("./LearningEngine");
Object.defineProperty(exports, "LearningEngine", { enumerable: true, get: function () { return LearningEngine_1.LearningEngine; } });
var PredictionManager_1 = require("./PredictionManager");
Object.defineProperty(exports, "PredictionManager", { enumerable: true, get: function () { return PredictionManager_1.PredictionManager; } });
var PredictionEngine_1 = require("./PredictionEngine");
Object.defineProperty(exports, "PredictionEngine", { enumerable: true, get: function () { return PredictionEngine_1.PredictionEngine; } });
var ContinuousPlanningEngine_1 = require("./ContinuousPlanningEngine");
Object.defineProperty(exports, "ContinuousPlanningEngine", { enumerable: true, get: function () { return ContinuousPlanningEngine_1.ContinuousPlanningEngine; } });
var MissionScheduler_1 = require("./MissionScheduler");
Object.defineProperty(exports, "MissionScheduler", { enumerable: true, get: function () { return MissionScheduler_1.MissionScheduler; } });
var MissionApprovalBridge_1 = require("./MissionApprovalBridge");
Object.defineProperty(exports, "MissionApprovalBridge", { enumerable: true, get: function () { return MissionApprovalBridge_1.MissionApprovalBridge; } });
var MissionPermissions_1 = require("./MissionPermissions");
Object.defineProperty(exports, "MissionPermissions", { enumerable: true, get: function () { return MissionPermissions_1.MissionPermissions; } });
var MissionHistory_1 = require("./MissionHistory");
Object.defineProperty(exports, "MissionHistory", { enumerable: true, get: function () { return MissionHistory_1.MissionHistory; } });
var MissionLogger_1 = require("./MissionLogger");
Object.defineProperty(exports, "MissionLogger", { enumerable: true, get: function () { return MissionLogger_1.MissionLogger; } });
var MissionValidator_1 = require("./MissionValidator");
Object.defineProperty(exports, "MissionValidator", { enumerable: true, get: function () { return MissionValidator_1.MissionValidator; } });
Object.defineProperty(exports, "MissionValidationError", { enumerable: true, get: function () { return MissionValidator_1.MissionValidationError; } });
var MissionEvents_1 = require("./MissionEvents");
Object.defineProperty(exports, "MissionEvents", { enumerable: true, get: function () { return MissionEvents_1.MissionEvents; } });
var MissionConfig_2 = require("./MissionConfig");
Object.defineProperty(exports, "DEFAULT_MISSION_CONFIG", { enumerable: true, get: function () { return MissionConfig_2.DEFAULT_MISSION_CONFIG; } });
__exportStar(require("./MissionTypes"), exports);
//# sourceMappingURL=index.js.map