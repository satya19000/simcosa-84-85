"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = exports.NoOpProvider = void 0;
// ── No-Op Provider (placeholder for unimplemented channels) ─────────────────
class NoOpProvider {
    constructor(id, name, type) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.supportsSearch = false;
        this.supportsAttachments = false;
        this.supportsRichContent = false;
    }
    async initialize(_config) { }
    async authenticate(_credentials) { }
    async connect(_userId) { }
    async disconnect(_userId) { }
    async send(_userId, _opts) {
        throw new Error(`Provider "${this.name}" is not yet implemented`);
    }
    async receive(_userId, _cursor) {
        return { messages: [], hasMore: false };
    }
    async sync(_userId) {
        return 0;
    }
    async search(_userId, _query, _limit) {
        return { messages: [], total: 0 };
    }
    async healthCheck(userId) {
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
exports.NoOpProvider = NoOpProvider;
// ── Base Abstract Provider ────────────────────────────────────────────────────
// Extend this when implementing a real provider.
class BaseProvider {
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
exports.BaseProvider = BaseProvider;
//# sourceMappingURL=CommunicationProvider.js.map