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
exports.ComputerFilePickerPlan = exports.ComputerExecutionValidator = exports.ComputerAuditStream = exports.ComputerDownloadManager = exports.ComputerDocumentBridge = exports.ComputerExecutionPipeline = exports.DEFAULT_COMPUTER_CONTROL_CONFIG = exports.ElectronDesktopProvider = exports.NativeOSProvider = exports.TauriProvider = exports.ElectronProvider = exports.DesktopAgentProvider = exports.BrowserExtensionProvider = exports.WebPWAProvider = exports.ComputerEvents = exports.ComputerActionExecutor = exports.ComputerActionPlanner = exports.ComputerSessionManager = exports.ComputerLogger = exports.ComputerAudit = exports.ComputerPolicyEngine = exports.ComputerApprovalBridge = exports.ComputerPermissions = exports.ComputerSafetyError = exports.ComputerSafetyGuard = exports.ComputerCapabilityRegistry = exports.BrowserBridge = exports.LocalBridge = exports.DesktopAgent = exports.BrowserAgent = exports.ComputerAgent = exports.ComputerControlEngine = void 0;
exports.getComputerControlEngine = getComputerControlEngine;
const ComputerControlEngine_1 = require("./ComputerControlEngine");
const ComputerConfig_1 = require("./ComputerConfig");
const security_1 = require("../security");
const delegation_1 = require("../delegation");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getSession(userId, db, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const tenants = new security_1.TenantEngine(db);
    const roles = new security_1.RoleManager(db, tenants);
    const permissionManager = new security_1.PermissionManager(db, tenants, roles);
    const rbac = new security_1.RBACEngine(db, tenants, roles, permissionManager);
    const approvalEngine = (0, delegation_1.getApprovalEngine)(userId, db, apiKey);
    const session = {
        engine: new ComputerControlEngine_1.ComputerControlEngine(db, ComputerConfig_1.DEFAULT_COMPUTER_CONTROL_CONFIG, tenants, rbac, approvalEngine),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getComputerControlEngine(userId, db, apiKey) {
    return getSession(userId, db, apiKey).engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────────
var ComputerControlEngine_2 = require("./ComputerControlEngine");
Object.defineProperty(exports, "ComputerControlEngine", { enumerable: true, get: function () { return ComputerControlEngine_2.ComputerControlEngine; } });
var ComputerAgent_1 = require("./ComputerAgent");
Object.defineProperty(exports, "ComputerAgent", { enumerable: true, get: function () { return ComputerAgent_1.ComputerAgent; } });
var BrowserAgent_1 = require("./BrowserAgent");
Object.defineProperty(exports, "BrowserAgent", { enumerable: true, get: function () { return BrowserAgent_1.BrowserAgent; } });
var DesktopAgent_1 = require("./DesktopAgent");
Object.defineProperty(exports, "DesktopAgent", { enumerable: true, get: function () { return DesktopAgent_1.DesktopAgent; } });
var LocalBridge_1 = require("./LocalBridge");
Object.defineProperty(exports, "LocalBridge", { enumerable: true, get: function () { return LocalBridge_1.LocalBridge; } });
var BrowserBridge_1 = require("./BrowserBridge");
Object.defineProperty(exports, "BrowserBridge", { enumerable: true, get: function () { return BrowserBridge_1.BrowserBridge; } });
var ComputerCapabilityRegistry_1 = require("./ComputerCapabilityRegistry");
Object.defineProperty(exports, "ComputerCapabilityRegistry", { enumerable: true, get: function () { return ComputerCapabilityRegistry_1.ComputerCapabilityRegistry; } });
var ComputerSafetyGuard_1 = require("./ComputerSafetyGuard");
Object.defineProperty(exports, "ComputerSafetyGuard", { enumerable: true, get: function () { return ComputerSafetyGuard_1.ComputerSafetyGuard; } });
Object.defineProperty(exports, "ComputerSafetyError", { enumerable: true, get: function () { return ComputerSafetyGuard_1.ComputerSafetyError; } });
var ComputerPermissions_1 = require("./ComputerPermissions");
Object.defineProperty(exports, "ComputerPermissions", { enumerable: true, get: function () { return ComputerPermissions_1.ComputerPermissions; } });
var ComputerApprovalBridge_1 = require("./ComputerApprovalBridge");
Object.defineProperty(exports, "ComputerApprovalBridge", { enumerable: true, get: function () { return ComputerApprovalBridge_1.ComputerApprovalBridge; } });
var ComputerPolicyEngine_1 = require("./ComputerPolicyEngine");
Object.defineProperty(exports, "ComputerPolicyEngine", { enumerable: true, get: function () { return ComputerPolicyEngine_1.ComputerPolicyEngine; } });
var ComputerAudit_1 = require("./ComputerAudit");
Object.defineProperty(exports, "ComputerAudit", { enumerable: true, get: function () { return ComputerAudit_1.ComputerAudit; } });
var ComputerLogger_1 = require("./ComputerLogger");
Object.defineProperty(exports, "ComputerLogger", { enumerable: true, get: function () { return ComputerLogger_1.ComputerLogger; } });
var ComputerSessionManager_1 = require("./ComputerSessionManager");
Object.defineProperty(exports, "ComputerSessionManager", { enumerable: true, get: function () { return ComputerSessionManager_1.ComputerSessionManager; } });
var ComputerActionPlanner_1 = require("./ComputerActionPlanner");
Object.defineProperty(exports, "ComputerActionPlanner", { enumerable: true, get: function () { return ComputerActionPlanner_1.ComputerActionPlanner; } });
var ComputerActionExecutor_1 = require("./ComputerActionExecutor");
Object.defineProperty(exports, "ComputerActionExecutor", { enumerable: true, get: function () { return ComputerActionExecutor_1.ComputerActionExecutor; } });
var ComputerEvents_1 = require("./ComputerEvents");
Object.defineProperty(exports, "ComputerEvents", { enumerable: true, get: function () { return ComputerEvents_1.ComputerEvents; } });
var ComputerProvider_1 = require("./ComputerProvider");
Object.defineProperty(exports, "WebPWAProvider", { enumerable: true, get: function () { return ComputerProvider_1.WebPWAProvider; } });
Object.defineProperty(exports, "BrowserExtensionProvider", { enumerable: true, get: function () { return ComputerProvider_1.BrowserExtensionProvider; } });
Object.defineProperty(exports, "DesktopAgentProvider", { enumerable: true, get: function () { return ComputerProvider_1.DesktopAgentProvider; } });
Object.defineProperty(exports, "ElectronProvider", { enumerable: true, get: function () { return ComputerProvider_1.ElectronProvider; } });
Object.defineProperty(exports, "TauriProvider", { enumerable: true, get: function () { return ComputerProvider_1.TauriProvider; } });
Object.defineProperty(exports, "NativeOSProvider", { enumerable: true, get: function () { return ComputerProvider_1.NativeOSProvider; } });
Object.defineProperty(exports, "ElectronDesktopProvider", { enumerable: true, get: function () { return ComputerProvider_1.ElectronDesktopProvider; } });
var ComputerConfig_2 = require("./ComputerConfig");
Object.defineProperty(exports, "DEFAULT_COMPUTER_CONTROL_CONFIG", { enumerable: true, get: function () { return ComputerConfig_2.DEFAULT_COMPUTER_CONTROL_CONFIG; } });
__exportStar(require("./ComputerTypes"), exports);
// Phase 5.6
var ComputerExecutionPipeline_1 = require("./ComputerExecutionPipeline");
Object.defineProperty(exports, "ComputerExecutionPipeline", { enumerable: true, get: function () { return ComputerExecutionPipeline_1.ComputerExecutionPipeline; } });
var ComputerDocumentBridge_1 = require("./ComputerDocumentBridge");
Object.defineProperty(exports, "ComputerDocumentBridge", { enumerable: true, get: function () { return ComputerDocumentBridge_1.ComputerDocumentBridge; } });
var ComputerDownloadManager_1 = require("./ComputerDownloadManager");
Object.defineProperty(exports, "ComputerDownloadManager", { enumerable: true, get: function () { return ComputerDownloadManager_1.ComputerDownloadManager; } });
var ComputerAuditStream_1 = require("./ComputerAuditStream");
Object.defineProperty(exports, "ComputerAuditStream", { enumerable: true, get: function () { return ComputerAuditStream_1.ComputerAuditStream; } });
var ComputerExecutionValidator_1 = require("./ComputerExecutionValidator");
Object.defineProperty(exports, "ComputerExecutionValidator", { enumerable: true, get: function () { return ComputerExecutionValidator_1.ComputerExecutionValidator; } });
var ComputerFilePickerPlan_1 = require("./ComputerFilePickerPlan");
Object.defineProperty(exports, "ComputerFilePickerPlan", { enumerable: true, get: function () { return ComputerFilePickerPlan_1.ComputerFilePickerPlan; } });
__exportStar(require("./ComputerExecutionTypes"), exports);
//# sourceMappingURL=index.js.map