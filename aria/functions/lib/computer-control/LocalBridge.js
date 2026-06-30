"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalBridge = void 0;
const uuid_1 = require("uuid");
const AGENT_COL = (tenantId) => `tenants/${tenantId}/computerAgents`;
/**
 * LocalBridge — Architecture/placeholder for the Local Desktop Agent handshake.
 *
 * NOT IMPLEMENTED: No native app, no binary, no installer exists.
 * All methods return placeholder registration records and are explicitly
 * documented as architecture stubs for future implementation.
 *
 * Future design:
 * - A local agent binary would run on the user's machine.
 * - It would register here with a deviceId, publicKey, and capabilityGrant.
 * - Heartbeat calls would maintain health status.
 * - All capability execution would still go through the approval bridge.
 *
 * Tenant membership is verified before every operation.
 */
class LocalBridge {
    constructor(db, tenants, audit) {
        this.db = db;
        this.tenants = tenants;
        this.audit = audit;
    }
    /**
     * Register a local agent. PLACEHOLDER — no verification of the publicKey or
     * agent binary is performed. Returns a registration record for the UI to display.
     */
    async registerLocalAgent(tenantId, userId, input) {
        await this.tenants.requireIdentity(tenantId, userId);
        const agentId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const registration = {
            agentId,
            deviceId: input.deviceId,
            userId,
            tenantId,
            publicKey: input.publicKey,
            sessionId: null,
            capabilityGrant: input.capabilityGrant,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            revokedAt: null,
            healthStatus: 'unknown',
            registeredAt: now,
            updatedAt: now,
            _placeholder: true,
        };
        await this.db.collection(AGENT_COL(tenantId)).doc(agentId).set(registration);
        await this.audit.record({
            tenantId,
            userId,
            eventType: 'agent.registered',
            agentId,
            metadata: { deviceId: input.deviceId, placeholder: true },
        });
        return registration;
    }
    async revokeLocalAgent(tenantId, userId, agentId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const ref = this.db.collection(AGENT_COL(tenantId)).doc(agentId);
        await ref.update({ revokedAt: new Date().toISOString(), healthStatus: 'unreachable', updatedAt: new Date().toISOString() });
        await this.audit.record({ tenantId, userId, eventType: 'agent.revoked', agentId, metadata: {} });
    }
    async listLocalAgents(tenantId, userId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const snap = await this.db.collection(AGENT_COL(tenantId)).where('userId', '==', userId).get();
        return snap.docs.map((d) => d.data());
    }
    async heartbeatLocalAgent(tenantId, userId, agentId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const ref = this.db.collection(AGENT_COL(tenantId)).doc(agentId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ healthStatus: 'healthy', updatedAt: new Date().toISOString() });
        return (await ref.get()).data();
    }
}
exports.LocalBridge = LocalBridge;
//# sourceMappingURL=LocalBridge.js.map