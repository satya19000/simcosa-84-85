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
exports.WorkspaceLogger = exports.DEFAULT_WORKSPACE_CONFIG = exports.WorkspaceValidationError = exports.WorkspaceValidator = exports.WorkspaceNotifications = exports.WorkspaceEvents = exports.WorkspacePolicies = exports.WorkspacePermissions = exports.OrganizationAnalytics = exports.ActivityFeed = exports.DelegationManager = exports.InvitationManager = exports.MemberManager = exports.WorkspaceManager = exports.OrganizationManager = exports.OrganizationEngine = void 0;
exports.getOrganizationEngine = getOrganizationEngine;
const OrganizationEngine_1 = require("./OrganizationEngine");
const WorkspaceConfig_1 = require("./WorkspaceConfig");
const mission_control_1 = require("../mission-control");
const delegation_1 = require("../delegation");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getSession(userId, db, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const missionEngine = (0, mission_control_1.getMissionEngine)(userId, db, apiKey);
    const approvalEngine = (0, delegation_1.getApprovalEngine)(userId, db, apiKey);
    const session = {
        engine: new OrganizationEngine_1.OrganizationEngine(db, WorkspaceConfig_1.DEFAULT_WORKSPACE_CONFIG, apiKey, missionEngine, approvalEngine),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getOrganizationEngine(userId, db, apiKey) {
    return getSession(userId, db, apiKey).engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────────
var OrganizationEngine_2 = require("./OrganizationEngine");
Object.defineProperty(exports, "OrganizationEngine", { enumerable: true, get: function () { return OrganizationEngine_2.OrganizationEngine; } });
var OrganizationManager_1 = require("./OrganizationManager");
Object.defineProperty(exports, "OrganizationManager", { enumerable: true, get: function () { return OrganizationManager_1.OrganizationManager; } });
var WorkspaceManager_1 = require("./WorkspaceManager");
Object.defineProperty(exports, "WorkspaceManager", { enumerable: true, get: function () { return WorkspaceManager_1.WorkspaceManager; } });
var MemberManager_1 = require("./MemberManager");
Object.defineProperty(exports, "MemberManager", { enumerable: true, get: function () { return MemberManager_1.MemberManager; } });
var InvitationManager_1 = require("./InvitationManager");
Object.defineProperty(exports, "InvitationManager", { enumerable: true, get: function () { return InvitationManager_1.InvitationManager; } });
var DelegationManager_1 = require("./DelegationManager");
Object.defineProperty(exports, "DelegationManager", { enumerable: true, get: function () { return DelegationManager_1.DelegationManager; } });
var ActivityFeed_1 = require("./ActivityFeed");
Object.defineProperty(exports, "ActivityFeed", { enumerable: true, get: function () { return ActivityFeed_1.ActivityFeed; } });
var OrganizationAnalytics_1 = require("./OrganizationAnalytics");
Object.defineProperty(exports, "OrganizationAnalytics", { enumerable: true, get: function () { return OrganizationAnalytics_1.OrganizationAnalytics; } });
var WorkspacePermissions_1 = require("./WorkspacePermissions");
Object.defineProperty(exports, "WorkspacePermissions", { enumerable: true, get: function () { return WorkspacePermissions_1.WorkspacePermissions; } });
var WorkspacePolicies_1 = require("./WorkspacePolicies");
Object.defineProperty(exports, "WorkspacePolicies", { enumerable: true, get: function () { return WorkspacePolicies_1.WorkspacePolicies; } });
var WorkspaceEvents_1 = require("./WorkspaceEvents");
Object.defineProperty(exports, "WorkspaceEvents", { enumerable: true, get: function () { return WorkspaceEvents_1.WorkspaceEvents; } });
var WorkspaceNotifications_1 = require("./WorkspaceNotifications");
Object.defineProperty(exports, "WorkspaceNotifications", { enumerable: true, get: function () { return WorkspaceNotifications_1.WorkspaceNotifications; } });
var WorkspaceValidator_1 = require("./WorkspaceValidator");
Object.defineProperty(exports, "WorkspaceValidator", { enumerable: true, get: function () { return WorkspaceValidator_1.WorkspaceValidator; } });
Object.defineProperty(exports, "WorkspaceValidationError", { enumerable: true, get: function () { return WorkspaceValidator_1.WorkspaceValidationError; } });
var WorkspaceConfig_2 = require("./WorkspaceConfig");
Object.defineProperty(exports, "DEFAULT_WORKSPACE_CONFIG", { enumerable: true, get: function () { return WorkspaceConfig_2.DEFAULT_WORKSPACE_CONFIG; } });
var WorkspaceLogger_1 = require("./WorkspaceLogger");
Object.defineProperty(exports, "WorkspaceLogger", { enumerable: true, get: function () { return WorkspaceLogger_1.WorkspaceLogger; } });
__exportStar(require("./WorkspaceTypes"), exports);
//# sourceMappingURL=index.js.map