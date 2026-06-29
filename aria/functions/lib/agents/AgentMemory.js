"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMemory = void 0;
/**
 * In-process memory for a single agent instance.
 * Resets on cold start — for persistence, agents write to Firestore via ActionEngine.
 */
class AgentMemory {
    constructor(agentId, ttlMs = 60000) {
        this.agentId = agentId;
        this.cache = new Map();
        this.recentJobs = [];
        this.maxJobs = 50;
        this.ttlMs = ttlMs;
    }
    // ── Cache ──────────────────────────────────────────────────────────────────
    set(key, value, ttlMs) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (ttlMs ?? this.ttlMs),
        });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    has(key) {
        return this.get(key) !== null;
    }
    delete(key) {
        this.cache.delete(key);
    }
    evictExpired() {
        const now = Date.now();
        let evicted = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                evicted++;
            }
        }
        return evicted;
    }
    // ── Recent jobs ────────────────────────────────────────────────────────────
    recordJob(job) {
        this.recentJobs.unshift(job);
        if (this.recentJobs.length > this.maxJobs)
            this.recentJobs.pop();
    }
    getRecentJobs(limit = 10) {
        return this.recentJobs.slice(0, limit);
    }
    // ── Diagnostics ────────────────────────────────────────────────────────────
    cacheSize() { return this.cache.size; }
    jobCount() { return this.recentJobs.length; }
    agentId_() { return this.agentId; }
}
exports.AgentMemory = AgentMemory;
//# sourceMappingURL=AgentMemory.js.map