"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerAudit = void 0;
const uuid_1 = require("uuid");
const AUDIT_COL = (tenantId) => `tenants/${tenantId}/computerAudit`;
/**
 * Append-only audit log for all computer-control actions.
 * Observability events logged: action planned, action approved, action blocked,
 * action executed, capability denied, safety guard triggered, agent registered,
 * agent revoked, extension registered, extension revoked.
 *
 * Sensitive content is NEVER logged — only metadata identifiers and risk levels.
 */
class ComputerAudit {
    constructor(db) {
        this.db = db;
    }
    async record(params) {
        const auditId = (0, uuid_1.v4)();
        const event = {
            auditId,
            tenantId: params.tenantId,
            userId: params.userId,
            eventType: params.eventType,
            capabilityId: params.capabilityId,
            planId: params.planId,
            sessionId: params.sessionId,
            agentId: params.agentId,
            extensionId: params.extensionId,
            approvalRequestId: params.approvalRequestId,
            riskLevel: params.riskLevel,
            metadata: params.metadata ?? {},
            timestamp: new Date().toISOString(),
        };
        await this.db.collection(AUDIT_COL(params.tenantId)).doc(auditId).set(event);
        return event;
    }
    async listRecent(tenantId, limit = 50) {
        const snap = await this.db
            .collection(AUDIT_COL(tenantId))
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
}
exports.ComputerAudit = ComputerAudit;
//# sourceMappingURL=ComputerAudit.js.map