"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentHealthMonitor = void 0;
/** Tracks health state for all registered agents. */
class AgentHealthMonitor {
    constructor() {
        this.records = new Map();
        this.maxSnapshots = 10;
    }
    register(agentId) {
        this.records.set(agentId, {
            agentId,
            status: 'unregistered',
            lastHealthyAt: null,
            lastUnhealthyAt: null,
            consecutiveFailures: 0,
            snapshots: [],
        });
    }
    record(snapshot) {
        const record = this.records.get(snapshot.agentId);
        if (!record)
            return;
        record.status = snapshot.status;
        record.snapshots.unshift(snapshot);
        if (record.snapshots.length > this.maxSnapshots)
            record.snapshots.pop();
        if (snapshot.healthy) {
            record.lastHealthyAt = snapshot.lastCheckedAt;
            record.consecutiveFailures = 0;
        }
        else {
            record.lastUnhealthyAt = snapshot.lastCheckedAt;
            record.consecutiveFailures++;
        }
    }
    get(agentId) {
        return this.records.get(agentId);
    }
    getAll() {
        return Array.from(this.records.values());
    }
    isHealthy(agentId) {
        const record = this.records.get(agentId);
        if (!record)
            return false;
        return record.consecutiveFailures < 3 && record.status !== 'error' && record.status !== 'disabled';
    }
}
exports.AgentHealthMonitor = AgentHealthMonitor;
//# sourceMappingURL=AgentHealth.js.map