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
exports.logComputerActionResult = exports.listBrowserExtensions = exports.revokeBrowserExtension = exports.registerBrowserExtension = exports.listLocalAgents = exports.revokeLocalAgent = exports.registerLocalAgent = exports.requestComputerApproval = exports.planComputerAction = exports.listComputerCapabilities = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const computer_control_1 = require("./computer-control");
const SHARED_OPTS = {
    secrets: ['ANTHROPIC_API_KEY'],
    timeoutSeconds: 30,
};
function db() {
    return admin.firestore();
}
function apiKey() {
    return process.env.ANTHROPIC_API_KEY ?? '';
}
function requireAuth(request) {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required.');
    return request.auth.uid;
}
function wrapError(fn) {
    return fn().catch((err) => {
        const message = err instanceof Error ? err.message : 'Operation failed';
        if (message.includes('Access denied') || message.includes('no identity')) {
            throw new https_1.HttpsError('permission-denied', message);
        }
        if (message.includes('unconditionally blocked') || message.includes('CREDENTIAL_ACCESS_BLOCKED') || message.includes('ALWAYS BLOCKED')) {
            throw new https_1.HttpsError('permission-denied', message);
        }
        throw new https_1.HttpsError('failed-precondition', message);
    });
}
// ── Capability listing ─────────────────────────────────────────────────────
exports.listComputerCapabilities = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    requireAuth(request);
    const engine = (0, computer_control_1.getComputerControlEngine)(request.auth.uid, db(), apiKey());
    return engine.listCapabilities();
});
// ── Planning ───────────────────────────────────────────────────────────────
exports.planComputerAction = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, intent, manualSteps } = request.data;
    if (!tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!intent?.trim())
        throw new https_1.HttpsError('invalid-argument', 'intent required');
    const engine = (0, computer_control_1.getComputerControlEngine)(uid, db(), apiKey());
    return wrapError(() => engine.planAction(uid, tenantId, intent, manualSteps));
});
// ── Approval ───────────────────────────────────────────────────────────────
exports.requestComputerApproval = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const input = request.data;
    if (!input.tenantId?.trim())
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    if (!input.capabilityId)
        throw new https_1.HttpsError('invalid-argument', 'capabilityId required');
    const engine = (0, computer_control_1.getComputerControlEngine)(uid, db(), apiKey());
    return wrapError(() => engine.requestApproval({ ...input, userId: uid }));
});
// ── Local agent ─────────────────────────────────────────────────────────────
exports.registerLocalAgent = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, deviceId, publicKey, capabilityGrant } = request.data;
    if (!tenantId || !deviceId || !publicKey)
        throw new https_1.HttpsError('invalid-argument', 'tenantId, deviceId, publicKey required');
    const engine = (0, computer_control_1.getComputerControlEngine)(uid, db(), apiKey());
    return wrapError(() => engine.registerLocalAgent(tenantId, uid, { deviceId, publicKey, capabilityGrant: capabilityGrant ?? [] }));
});
exports.revokeLocalAgent = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, agentId } = request.data;
    if (!tenantId || !agentId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and agentId required');
    const engine = (0, computer_control_1.getComputerControlEngine)(uid, db(), apiKey());
    return wrapError(() => engine.revokeLocalAgent(tenantId, uid, agentId));
});
exports.listLocalAgents = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, computer_control_1.getComputerControlEngine)(uid, db(), apiKey());
    return wrapError(() => engine.listLocalAgents(tenantId, uid));
});
// ── Browser extension ──────────────────────────────────────────────────────
exports.registerBrowserExtension = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, browserName, version, grantedCapabilities } = request.data;
    if (!tenantId || !browserName || !version)
        throw new https_1.HttpsError('invalid-argument', 'tenantId, browserName, version required');
    const engine = (0, computer_control_1.getComputerControlEngine)(uid, db(), apiKey());
    return wrapError(() => engine.registerBrowserExtension(tenantId, uid, { browserName, version, grantedCapabilities: grantedCapabilities ?? [] }));
});
exports.revokeBrowserExtension = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, extensionId } = request.data;
    if (!tenantId || !extensionId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and extensionId required');
    const engine = (0, computer_control_1.getComputerControlEngine)(uid, db(), apiKey());
    return wrapError(() => engine.revokeBrowserExtension(tenantId, uid, extensionId));
});
exports.listBrowserExtensions = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, computer_control_1.getComputerControlEngine)(uid, db(), apiKey());
    return wrapError(() => engine.listBrowserExtensions(tenantId, uid));
});
// ── Audit / logging ────────────────────────────────────────────────────────
exports.logComputerActionResult = (0, https_1.onCall)(SHARED_OPTS, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, planId, capabilityId, success, metadata } = request.data;
    if (!tenantId || !planId || !capabilityId) {
        throw new https_1.HttpsError('invalid-argument', 'tenantId, planId, capabilityId required');
    }
    const engine = (0, computer_control_1.getComputerControlEngine)(uid, db(), apiKey());
    return wrapError(() => engine.logActionResult(tenantId, uid, planId, capabilityId, success, metadata ?? {}));
});
//# sourceMappingURL=computerControlApi.js.map