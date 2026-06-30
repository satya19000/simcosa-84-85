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
exports.getSecurityAnalytics = exports.listAuditEvents = exports.getDirectoryView = exports.listServiceAccounts = exports.createServiceAccount = exports.assignRoleToGroup = exports.removeGroupMember = exports.addGroupMember = exports.listGroups = exports.createGroup = exports.listSessions = exports.revokeSession = exports.refreshSession = exports.createSession = exports.evaluatePolicy = exports.listPolicies = exports.updatePolicy = exports.createPolicy = exports.revokeRoleAssignment = exports.assignRole = exports.listRoles = exports.createRole = exports.checkPermission = exports.listIdentities = exports.createIdentity = exports.listMyTenants = exports.getTenant = exports.createTenant = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const security_1 = require("./security");
const SecurityValidator_1 = require("./security/SecurityValidator");
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
        if (err instanceof SecurityValidator_1.SecurityValidationError)
            throw new https_1.HttpsError('invalid-argument', err.message);
        throw err;
    }
}
function wrapEngineError(fn) {
    return fn().catch((err) => {
        const message = err instanceof Error ? err.message : 'Operation failed';
        if (message.includes('Access denied'))
            throw new https_1.HttpsError('permission-denied', message);
        throw new https_1.HttpsError('failed-precondition', message);
    });
}
// ── Tenants ─────────────────────────────────────────────────────────────────
exports.createTenant = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    wrapValidation(() => SecurityValidator_1.SecurityValidator.validateCreateTenant(data));
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return engine.createTenant(uid, data);
});
exports.getTenant = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.getTenant(uid, tenantId));
});
exports.listMyTenants = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return engine.listMyTenants(uid);
});
// ── Identities ──────────────────────────────────────────────────────────────
exports.createIdentity = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    if (!data?.tenantId || !data?.displayName)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and displayName required');
    wrapValidation(() => SecurityValidator_1.SecurityValidator.validateIdentityType(data.type));
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    const { tenantId, ...rest } = data;
    return wrapEngineError(() => engine.createIdentity(uid, tenantId, rest));
});
exports.listIdentities = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listIdentities(uid, tenantId));
});
// ── RBAC ────────────────────────────────────────────────────────────────────
exports.checkPermission = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, action } = request.data;
    if (!tenantId || !action)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and action required');
    wrapValidation(() => SecurityValidator_1.SecurityValidator.validatePermissionAction(action));
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return engine.can(uid, tenantId, action);
});
// ── Roles ───────────────────────────────────────────────────────────────────
exports.createRole = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    if (!data?.tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    wrapValidation(() => SecurityValidator_1.SecurityValidator.validateCreateRole(data));
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    const { tenantId, ...rest } = data;
    return wrapEngineError(() => engine.createRole(uid, tenantId, rest));
});
exports.listRoles = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listRoles(uid, tenantId));
});
exports.assignRole = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    if (!data?.tenantId || !data?.identityId || !data?.roleId || !data?.scope) {
        throw new https_1.HttpsError('invalid-argument', 'tenantId, identityId, roleId, and scope required');
    }
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    const { tenantId, ...rest } = data;
    return wrapEngineError(() => engine.assignRole(uid, tenantId, rest));
});
exports.revokeRoleAssignment = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, assignmentId } = request.data;
    if (!tenantId || !assignmentId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and assignmentId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.revokeRoleAssignment(uid, tenantId, assignmentId));
});
// ── Policies ────────────────────────────────────────────────────────────────
exports.createPolicy = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    if (!data?.tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    wrapValidation(() => SecurityValidator_1.SecurityValidator.validateCreatePolicy(data));
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    const { tenantId, ...rest } = data;
    return wrapEngineError(() => engine.createPolicy(uid, tenantId, rest));
});
exports.updatePolicy = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, policyId, ...fields } = request.data;
    if (!tenantId || !policyId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and policyId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.updatePolicy(uid, tenantId, policyId, fields));
});
exports.listPolicies = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listPolicies(uid, tenantId));
});
exports.evaluatePolicy = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, action } = request.data;
    if (!tenantId || !action)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and action required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.evaluatePolicy(uid, tenantId, action));
});
// ── Sessions ────────────────────────────────────────────────────────────────
exports.createSession = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    if (!data?.tenantId || !data?.identityId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and identityId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    const { tenantId, ...rest } = data;
    return wrapEngineError(() => engine.createSession(uid, tenantId, rest));
});
exports.refreshSession = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId } = request.data;
    if (!tenantId || !sessionId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and sessionId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.refreshSession(uid, tenantId, sessionId));
});
exports.revokeSession = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, sessionId } = request.data;
    if (!tenantId || !sessionId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and sessionId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.revokeSession(uid, tenantId, sessionId));
});
exports.listSessions = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, forUserId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listSessions(uid, tenantId, forUserId));
});
// ── Groups ──────────────────────────────────────────────────────────────────
exports.createGroup = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    if (!data?.tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    wrapValidation(() => SecurityValidator_1.SecurityValidator.validateCreateGroup(data));
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    const { tenantId, ...rest } = data;
    return wrapEngineError(() => engine.createGroup(uid, tenantId, rest));
});
exports.listGroups = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listGroups(uid, tenantId));
});
exports.addGroupMember = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, groupId, identityId } = request.data;
    if (!tenantId || !groupId || !identityId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId, groupId, and identityId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.addMemberToGroup(uid, tenantId, groupId, identityId));
});
exports.removeGroupMember = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, groupId, identityId } = request.data;
    if (!tenantId || !groupId || !identityId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId, groupId, and identityId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.removeMemberFromGroup(uid, tenantId, groupId, identityId));
});
exports.assignRoleToGroup = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, groupId, roleId } = request.data;
    if (!tenantId || !groupId || !roleId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId, groupId, and roleId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.assignRoleToGroup(uid, tenantId, groupId, roleId));
});
// ── User Directory ──────────────────────────────────────────────────────────
exports.createServiceAccount = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    if (!data?.tenantId || !data?.name)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and name required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    const { tenantId, ...rest } = data;
    return wrapEngineError(() => engine.createServiceAccount(uid, tenantId, rest));
});
exports.listServiceAccounts = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listServiceAccounts(uid, tenantId));
});
exports.getDirectoryView = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, organizationId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.getDirectoryView(uid, tenantId, organizationId ?? null));
});
// ── Audit ───────────────────────────────────────────────────────────────────
exports.listAuditEvents = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, limit } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listAuditEvents(uid, tenantId, limit));
});
// ── Analytics ───────────────────────────────────────────────────────────────
exports.getSecurityAnalytics = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, security_1.getSecurityEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.getAnalytics(uid, tenantId));
});
//# sourceMappingURL=securityApi.js.map