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
exports.getOrganizationAnalytics = exports.getSharedTaskApprovalStatus = exports.requestSharedApproval = exports.listSharedTasks = exports.delegateTask = exports.listSharedMissions = exports.assignMissionToWorkspace = exports.postAnnouncement = exports.listActivity = exports.revokeInvitation = exports.acceptInvitation = exports.listInvitations = exports.inviteMember = exports.changeMemberRole = exports.removeMember = exports.listMembers = exports.listWorkspaces = exports.getWorkspace = exports.createWorkspace = exports.listMyOrganizations = exports.updateOrganization = exports.getOrganization = exports.createOrganization = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const organization_1 = require("./organization");
const WorkspaceValidator_1 = require("./organization/WorkspaceValidator");
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
        if (err instanceof WorkspaceValidator_1.WorkspaceValidationError)
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
// ── Organizations ────────────────────────────────────────────────────────────
exports.createOrganization = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    wrapValidation(() => WorkspaceValidator_1.WorkspaceValidator.validateCreateOrganization(data));
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return engine.createOrganization(uid, data);
});
exports.getOrganization = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId } = request.data;
    if (!organizationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.getOrganization(uid, organizationId));
});
exports.updateOrganization = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, ...fields } = request.data;
    if (!organizationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.updateOrganization(uid, organizationId, fields));
});
exports.listMyOrganizations = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { candidateOrganizationIds } = (request.data ?? {});
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return engine.listMyOrganizations(uid, candidateOrganizationIds ?? []);
});
// ── Workspaces ────────────────────────────────────────────────────────────────
exports.createWorkspace = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    wrapValidation(() => WorkspaceValidator_1.WorkspaceValidator.validateCreateWorkspace(data));
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.createWorkspace(uid, data.organizationId, data));
});
exports.getWorkspace = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, workspaceId } = request.data;
    if (!organizationId || !workspaceId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId and workspaceId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.getWorkspace(uid, organizationId, workspaceId));
});
exports.listWorkspaces = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId } = request.data;
    if (!organizationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listWorkspaces(uid, organizationId));
});
// ── Members ───────────────────────────────────────────────────────────────────
exports.listMembers = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId } = request.data;
    if (!organizationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listMembers(uid, organizationId));
});
exports.removeMember = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, memberId } = request.data;
    if (!organizationId || !memberId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId and memberId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.removeMember(uid, organizationId, memberId));
});
exports.changeMemberRole = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, memberId, role } = request.data;
    if (!organizationId || !memberId || !role)
        throw new https_1.HttpsError('invalid-argument', 'organizationId, memberId, and role required');
    wrapValidation(() => WorkspaceValidator_1.WorkspaceValidator.validateRole(role));
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.changeMemberRole(uid, organizationId, memberId, role));
});
// ── Invitations ───────────────────────────────────────────────────────────────
exports.inviteMember = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    wrapValidation(() => WorkspaceValidator_1.WorkspaceValidator.validateInvite(data));
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.inviteMember(uid, data.organizationId, data));
});
exports.listInvitations = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId } = request.data;
    if (!organizationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listInvitations(uid, organizationId));
});
exports.acceptInvitation = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, invitationId } = request.data;
    if (!organizationId || !invitationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId and invitationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    const profile = {
        displayName: request.auth?.token?.name ?? request.auth?.token?.email ?? 'New member',
        email: request.auth?.token?.email ?? '',
    };
    return wrapEngineError(() => engine.acceptInvitation(uid, organizationId, invitationId, profile));
});
exports.revokeInvitation = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, invitationId } = request.data;
    if (!organizationId || !invitationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId and invitationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.revokeInvitation(uid, organizationId, invitationId));
});
// ── Activity feed / Announcements ──────────────────────────────────────────────
exports.listActivity = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, workspaceId } = request.data;
    if (!organizationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listActivity(uid, organizationId, workspaceId));
});
exports.postAnnouncement = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    wrapValidation(() => WorkspaceValidator_1.WorkspaceValidator.validateAnnouncement(data));
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.postAnnouncement(uid, data.organizationId, data));
});
// ── Mission Control integration ────────────────────────────────────────────────
exports.assignMissionToWorkspace = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, workspaceId, missionId, assignedMemberIds } = request.data;
    if (!organizationId || !workspaceId || !missionId || !assignedMemberIds?.length) {
        throw new https_1.HttpsError('invalid-argument', 'organizationId, workspaceId, missionId, and assignedMemberIds required');
    }
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.assignMissionToWorkspace(uid, organizationId, workspaceId, missionId, assignedMemberIds));
});
exports.listSharedMissions = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, workspaceId } = request.data;
    if (!organizationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listSharedMissions(uid, organizationId, workspaceId));
});
// ── Team delegation (shared tasks) ────────────────────────────────────────────
exports.delegateTask = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, workspaceId, title, description, assignedTo } = request.data;
    if (!organizationId || !workspaceId || !title)
        throw new https_1.HttpsError('invalid-argument', 'organizationId, workspaceId, and title required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.delegateTask(uid, organizationId, workspaceId, { title, description, assignedTo }));
});
exports.listSharedTasks = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, workspaceId } = request.data;
    if (!organizationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listSharedTasks(uid, organizationId, workspaceId));
});
// ── Shared approvals (via real ApprovalEngine only) ────────────────────────────
exports.requestSharedApproval = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    if (!data?.organizationId || !data?.taskId || !data?.title || !data?.triggerType || !data?.riskFactors) {
        throw new https_1.HttpsError('invalid-argument', 'organizationId, taskId, title, triggerType, and riskFactors are required');
    }
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    const { organizationId, taskId, ...approvalInput } = data;
    return wrapEngineError(() => engine.requestApprovalForSharedTask(uid, organizationId, taskId, approvalInput));
});
exports.getSharedTaskApprovalStatus = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId, taskId } = request.data;
    if (!organizationId || !taskId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId and taskId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.getSharedTaskApprovalStatus(uid, organizationId, taskId));
});
// ── Analytics ───────────────────────────────────────────────────────────────────
exports.getOrganizationAnalytics = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { organizationId } = request.data;
    if (!organizationId)
        throw new https_1.HttpsError('invalid-argument', 'organizationId required');
    const engine = (0, organization_1.getOrganizationEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.getAnalytics(uid, organizationId));
});
//# sourceMappingURL=organizationApi.js.map