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
exports.DEFAULT_MARKETPLACE_CONFIG = exports.MarketplaceLogger = exports.SkillAnalytics = exports.SkillBilling = exports.SkillVersionManager = exports.SkillReviewManager = exports.SkillPermissions = exports.SkillSecurityScanner = exports.SkillDependencyResolver = exports.SkillCompatibility = exports.SkillValidationError = exports.SkillValidator = exports.SkillNotifications = exports.SkillEvents = exports.SkillCatalog = exports.SkillInstaller = exports.SkillManager = exports.MarketplaceRegistry = exports.MarketplaceEngine = void 0;
exports.getMarketplaceEngine = getMarketplaceEngine;
const MarketplaceEngine_1 = require("./MarketplaceEngine");
const MarketplaceConfig_1 = require("./MarketplaceConfig");
const delegation_1 = require("../delegation");
const security_1 = require("../security");
const plugins_1 = require("../plugins");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getSession(userId, db, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const approvalEngine = (0, delegation_1.getApprovalEngine)(userId, db, apiKey);
    const tenants = new security_1.TenantEngine(db);
    const roles = new security_1.RoleManager(db, tenants);
    const permissions = new security_1.PermissionManager(db, tenants, roles);
    const rbac = new security_1.RBACEngine(db, tenants, roles, permissions);
    const pluginRuntime = (0, plugins_1.getPluginRuntime)(db);
    const session = {
        engine: new MarketplaceEngine_1.MarketplaceEngine(db, MarketplaceConfig_1.DEFAULT_MARKETPLACE_CONFIG, apiKey, tenants, rbac, approvalEngine, pluginRuntime),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getMarketplaceEngine(userId, db, apiKey) {
    return getSession(userId, db, apiKey).engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────
var MarketplaceEngine_2 = require("./MarketplaceEngine");
Object.defineProperty(exports, "MarketplaceEngine", { enumerable: true, get: function () { return MarketplaceEngine_2.MarketplaceEngine; } });
var MarketplaceRegistry_1 = require("./MarketplaceRegistry");
Object.defineProperty(exports, "MarketplaceRegistry", { enumerable: true, get: function () { return MarketplaceRegistry_1.MarketplaceRegistry; } });
var SkillManager_1 = require("./SkillManager");
Object.defineProperty(exports, "SkillManager", { enumerable: true, get: function () { return SkillManager_1.SkillManager; } });
var SkillInstaller_1 = require("./SkillInstaller");
Object.defineProperty(exports, "SkillInstaller", { enumerable: true, get: function () { return SkillInstaller_1.SkillInstaller; } });
var SkillCatalog_1 = require("./SkillCatalog");
Object.defineProperty(exports, "SkillCatalog", { enumerable: true, get: function () { return SkillCatalog_1.SkillCatalog; } });
var SkillEvents_1 = require("./SkillEvents");
Object.defineProperty(exports, "SkillEvents", { enumerable: true, get: function () { return SkillEvents_1.SkillEvents; } });
var SkillNotifications_1 = require("./SkillNotifications");
Object.defineProperty(exports, "SkillNotifications", { enumerable: true, get: function () { return SkillNotifications_1.SkillNotifications; } });
var SkillValidator_1 = require("./SkillValidator");
Object.defineProperty(exports, "SkillValidator", { enumerable: true, get: function () { return SkillValidator_1.SkillValidator; } });
Object.defineProperty(exports, "SkillValidationError", { enumerable: true, get: function () { return SkillValidator_1.SkillValidationError; } });
var SkillCompatibility_1 = require("./SkillCompatibility");
Object.defineProperty(exports, "SkillCompatibility", { enumerable: true, get: function () { return SkillCompatibility_1.SkillCompatibility; } });
var SkillDependencyResolver_1 = require("./SkillDependencyResolver");
Object.defineProperty(exports, "SkillDependencyResolver", { enumerable: true, get: function () { return SkillDependencyResolver_1.SkillDependencyResolver; } });
var SkillSecurityScanner_1 = require("./SkillSecurityScanner");
Object.defineProperty(exports, "SkillSecurityScanner", { enumerable: true, get: function () { return SkillSecurityScanner_1.SkillSecurityScanner; } });
var SkillPermissions_1 = require("./SkillPermissions");
Object.defineProperty(exports, "SkillPermissions", { enumerable: true, get: function () { return SkillPermissions_1.SkillPermissions; } });
var SkillReviewManager_1 = require("./SkillReviewManager");
Object.defineProperty(exports, "SkillReviewManager", { enumerable: true, get: function () { return SkillReviewManager_1.SkillReviewManager; } });
var SkillVersionManager_1 = require("./SkillVersionManager");
Object.defineProperty(exports, "SkillVersionManager", { enumerable: true, get: function () { return SkillVersionManager_1.SkillVersionManager; } });
var SkillBilling_1 = require("./SkillBilling");
Object.defineProperty(exports, "SkillBilling", { enumerable: true, get: function () { return SkillBilling_1.SkillBilling; } });
var SkillAnalytics_1 = require("./SkillAnalytics");
Object.defineProperty(exports, "SkillAnalytics", { enumerable: true, get: function () { return SkillAnalytics_1.SkillAnalytics; } });
var MarketplaceLogger_1 = require("./MarketplaceLogger");
Object.defineProperty(exports, "MarketplaceLogger", { enumerable: true, get: function () { return MarketplaceLogger_1.MarketplaceLogger; } });
var MarketplaceConfig_2 = require("./MarketplaceConfig");
Object.defineProperty(exports, "DEFAULT_MARKETPLACE_CONFIG", { enumerable: true, get: function () { return MarketplaceConfig_2.DEFAULT_MARKETPLACE_CONFIG; } });
__exportStar(require("./MarketplaceTypes"), exports);
//# sourceMappingURL=index.js.map