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
exports.SecurityLogger = exports.DEFAULT_SECURITY_CONFIG = exports.SecurityValidationError = exports.SecurityValidator = exports.SecurityAnalytics = exports.SecurityEventType = exports.SecurityAudit = exports.GroupManager = exports.UserDirectory = exports.SessionManager = exports.PolicyEngine = exports.PermissionManager = exports.RoleManager = exports.RBACEngine = exports.IdentityEngine = exports.TenantEngine = exports.SecurityEngine = void 0;
exports.getSecurityEngine = getSecurityEngine;
const SecurityEngine_1 = require("./SecurityEngine");
const SecurityConfig_1 = require("./SecurityConfig");
const delegation_1 = require("../delegation");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getSession(userId, db, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const approvalEngine = (0, delegation_1.getApprovalEngine)(userId, db, apiKey);
    const session = {
        engine: new SecurityEngine_1.SecurityEngine(db, SecurityConfig_1.DEFAULT_SECURITY_CONFIG, apiKey, approvalEngine),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getSecurityEngine(userId, db, apiKey) {
    return getSession(userId, db, apiKey).engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────────
var SecurityEngine_2 = require("./SecurityEngine");
Object.defineProperty(exports, "SecurityEngine", { enumerable: true, get: function () { return SecurityEngine_2.SecurityEngine; } });
var TenantEngine_1 = require("./TenantEngine");
Object.defineProperty(exports, "TenantEngine", { enumerable: true, get: function () { return TenantEngine_1.TenantEngine; } });
var IdentityEngine_1 = require("./IdentityEngine");
Object.defineProperty(exports, "IdentityEngine", { enumerable: true, get: function () { return IdentityEngine_1.IdentityEngine; } });
var RBACEngine_1 = require("./RBACEngine");
Object.defineProperty(exports, "RBACEngine", { enumerable: true, get: function () { return RBACEngine_1.RBACEngine; } });
var RoleManager_1 = require("./RoleManager");
Object.defineProperty(exports, "RoleManager", { enumerable: true, get: function () { return RoleManager_1.RoleManager; } });
var PermissionManager_1 = require("./PermissionManager");
Object.defineProperty(exports, "PermissionManager", { enumerable: true, get: function () { return PermissionManager_1.PermissionManager; } });
var PolicyEngine_1 = require("./PolicyEngine");
Object.defineProperty(exports, "PolicyEngine", { enumerable: true, get: function () { return PolicyEngine_1.PolicyEngine; } });
var SessionManager_1 = require("./SessionManager");
Object.defineProperty(exports, "SessionManager", { enumerable: true, get: function () { return SessionManager_1.SessionManager; } });
var UserDirectory_1 = require("./UserDirectory");
Object.defineProperty(exports, "UserDirectory", { enumerable: true, get: function () { return UserDirectory_1.UserDirectory; } });
var GroupManager_1 = require("./GroupManager");
Object.defineProperty(exports, "GroupManager", { enumerable: true, get: function () { return GroupManager_1.GroupManager; } });
var SecurityAudit_1 = require("./SecurityAudit");
Object.defineProperty(exports, "SecurityAudit", { enumerable: true, get: function () { return SecurityAudit_1.SecurityAudit; } });
var SecurityEvents_1 = require("./SecurityEvents");
Object.defineProperty(exports, "SecurityEventType", { enumerable: true, get: function () { return SecurityEvents_1.SecurityEventType; } });
var SecurityAnalytics_1 = require("./SecurityAnalytics");
Object.defineProperty(exports, "SecurityAnalytics", { enumerable: true, get: function () { return SecurityAnalytics_1.SecurityAnalytics; } });
var SecurityValidator_1 = require("./SecurityValidator");
Object.defineProperty(exports, "SecurityValidator", { enumerable: true, get: function () { return SecurityValidator_1.SecurityValidator; } });
Object.defineProperty(exports, "SecurityValidationError", { enumerable: true, get: function () { return SecurityValidator_1.SecurityValidationError; } });
var SecurityConfig_2 = require("./SecurityConfig");
Object.defineProperty(exports, "DEFAULT_SECURITY_CONFIG", { enumerable: true, get: function () { return SecurityConfig_2.DEFAULT_SECURITY_CONFIG; } });
var SecurityLogger_1 = require("./SecurityLogger");
Object.defineProperty(exports, "SecurityLogger", { enumerable: true, get: function () { return SecurityLogger_1.SecurityLogger; } });
__exportStar(require("./SecurityTypes"), exports);
//# sourceMappingURL=index.js.map