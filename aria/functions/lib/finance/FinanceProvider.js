"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseFinanceProvider = exports.NoOpFinanceProvider = void 0;
// ── No-Op Provider (placeholder) ──────────────────────────────────────────────
class NoOpFinanceProvider {
    constructor(id, name, type) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
    async initialize(_config) { }
    async authenticate(_credentials) { }
    async connect(_userId) { }
    async disconnect(_userId) { }
    async search(_userId, _query, _limit) {
        return { items: [], total: 0 };
    }
    async sync(_userId) {
        return 0;
    }
    async healthCheck(userId) {
        void userId;
        return {
            providerId: this.id,
            status: 'disconnected',
            lastCheckedAt: new Date().toISOString(),
            error: `Provider "${this.name}" is a placeholder — not yet implemented`,
        };
    }
    async shutdown() { }
    getStatus(_userId) {
        return 'disconnected';
    }
}
exports.NoOpFinanceProvider = NoOpFinanceProvider;
// ── Base Abstract Provider ────────────────────────────────────────────────────
class BaseFinanceProvider {
    constructor() {
        this.statuses = new Map();
    }
    getStatus(userId) {
        return this.statuses.get(userId) ?? 'disconnected';
    }
    setStatus(userId, status) {
        this.statuses.set(userId, status);
    }
}
exports.BaseFinanceProvider = BaseFinanceProvider;
//# sourceMappingURL=FinanceProvider.js.map