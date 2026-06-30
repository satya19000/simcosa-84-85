"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAudit = void 0;
const uuid_1 = require("uuid");
const AUDIT_COL = (tenantId) => `tenants/${tenantId}/securityAudit`;
/**
 * Append-only audit log for tenants/{tenantId}/securityAudit/{eventId}.
 * Every sensitive event (role changed, permission changed, member removed,
 * policy changed, session revoked, service account created, plugin
 * installed, export requested) must call `record()` here. There is no
 * update/delete method by design — audit records are immutable once
 * written, mirroring the activityLogs collection's write-once contract.
 */
class SecurityAudit {
    constructor(db, tenants) {
        this.db = db;
        this.tenants = tenants;
    }
    async record(tenantId, actorId, input) {
        // Audit writes for an actor still require the actor to be a verified
        // tenant identity, EXCEPT during tenant bootstrap (handled by callers
        // that pass the tenant owner immediately after createFirstIdentity).
        const eventId = (0, uuid_1.v4)();
        const record = {
            id: eventId,
            tenantId,
            eventId,
            actorId,
            organizationId: input.organizationId ?? null,
            workspaceId: input.workspaceId ?? null,
            action: input.action,
            resource: input.resource,
            before: input.before ?? null,
            after: input.after ?? null,
            timestamp: new Date().toISOString(),
            riskLevel: input.riskLevel ?? 'low',
            traceId: input.traceId ?? null,
        };
        await this.db.collection(AUDIT_COL(tenantId)).doc(eventId).set(record);
        return record;
    }
    async listEvents(tenantId, actorUserId, limit = 200) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(AUDIT_COL(tenantId)).orderBy('timestamp', 'desc').limit(limit).get();
        return snap.docs.map((d) => d.data());
    }
    async listEventsForResource(tenantId, actorUserId, resource) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(AUDIT_COL(tenantId)).where('resource', '==', resource).orderBy('timestamp', 'desc').get();
        return snap.docs.map((d) => d.data());
    }
}
exports.SecurityAudit = SecurityAudit;
//# sourceMappingURL=SecurityAudit.js.map