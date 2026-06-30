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
exports.ComputerPolicyEngine = void 0;
const POLICY_COL = (tenantId) => `tenants/${tenantId}/computerPolicies`;
/**
 * Policy engine for computer-control capability grants.
 *
 * Policy invariants:
 * - credentialAccess is never in allowedCapabilities — ComputerSafetyGuard
 *   blocks it unconditionally before policy is even checked.
 * - paymentAction defaults to blocked=true at the policy level.
 * - All policy reads/writes verify tenant membership first.
 */
class ComputerPolicyEngine {
    constructor(db, tenants, rbac, capabilityRegistry) {
        this.db = db;
        this.tenants = tenants;
        this.rbac = rbac;
        this.capabilityRegistry = capabilityRegistry;
    }
    async getPolicy(tenantId, userId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const snap = await this.db.collection(POLICY_COL(tenantId)).limit(1).get();
        if (snap.empty)
            return null;
        return snap.docs[0].data();
    }
    async getOrCreateDefaultPolicy(tenantId, userId) {
        const existing = await this.getPolicy(tenantId, userId);
        if (existing)
            return existing;
        return this.createDefaultPolicy(tenantId, userId);
    }
    async createDefaultPolicy(tenantId, createdBy) {
        const { v4: uuidv4 } = await Promise.resolve().then(() => __importStar(require('uuid')));
        const id = uuidv4();
        const now = new Date().toISOString();
        // Default: allow only the safest capabilities; block everything high-risk
        const safeDefaults = [
            'readVisiblePage',
            'summarizeVisiblePage',
            'openUrl',
            'searchWeb',
            'copyToClipboard',
            'uploadFileWithUserPicker',
        ];
        const policy = {
            id,
            tenantId,
            allowedCapabilities: safeDefaults,
            blockedCapabilities: ['credentialAccess', 'paymentAction'],
            requireApprovalForAll: false,
            paymentActionBlocked: true,
            createdBy,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(POLICY_COL(tenantId)).doc(id).set(policy);
        return policy;
    }
    async updatePolicy(tenantId, userId, fields) {
        await this.tenants.requireIdentity(tenantId, userId);
        await this.rbac.requirePermission(tenantId, userId, 'security.manage');
        // credentialAccess must never appear in allowedCapabilities
        if (fields.allowedCapabilities) {
            fields.allowedCapabilities = fields.allowedCapabilities.filter((c) => c !== 'credentialAccess');
        }
        const existing = await this.getOrCreateDefaultPolicy(tenantId, userId);
        const updated = {
            ...existing,
            ...fields,
            updatedAt: new Date().toISOString(),
        };
        await this.db.collection(POLICY_COL(tenantId)).doc(existing.id).set(updated);
        return updated;
    }
    isCapabilityAllowedByPolicy(policy, capabilityId) {
        // credentialAccess is NEVER allowed by policy
        if (capabilityId === 'credentialAccess')
            return false;
        // paymentAction: check policy block flag
        if (capabilityId === 'paymentAction' && policy.paymentActionBlocked)
            return false;
        if (policy.blockedCapabilities.includes(capabilityId))
            return false;
        const descriptor = this.capabilityRegistry.get(capabilityId);
        if (descriptor?.alwaysBlocked)
            return false;
        if (descriptor?.policyBlocked && !policy.allowedCapabilities.includes(capabilityId))
            return false;
        return true;
    }
}
exports.ComputerPolicyEngine = ComputerPolicyEngine;
//# sourceMappingURL=ComputerPolicyEngine.js.map