"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
/**
 * Loads user memory context from shared vars or Firestore.
 * Delegates to sharedVars['memoryContext'] when available (pre-loaded by Orchestrator).
 */
class MemoryAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'memory-agent',
            name: 'Memory Agent',
            description: 'Surfaces relevant user context for other agents to consume',
            version: '1.0.0',
            capabilities: ['memory'],
        };
    }
    canHandle(task) {
        return task.capability === 'memory';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        // If memory was pre-loaded into sharedVars (e.g. by Orchestrator), return it
        const preloaded = ctx.sharedVars['memoryContext'];
        if (preloaded) {
            return this.makeResult(task, ctx, preloaded, 'Memory context loaded from shared vars', startMs);
        }
        // Fallback: load basic profile from Firestore (read-only — no writes)
        try {
            const userDoc = await ctx.db.doc(`users/${ctx.userId}`).get();
            const profile = userDoc.data() ?? {};
            const output = {
                displayName: ctx.userDisplayName,
                preferences: profile['preferences'] ?? {},
                timezone: profile['timezone'] ?? 'UTC',
            };
            return this.makeResult(task, ctx, output, 'Loaded user profile from Firestore', startMs);
        }
        catch (err) {
            return this.makeErrorResult(task, ctx, err, startMs);
        }
    }
}
exports.MemoryAgent = MemoryAgent;
//# sourceMappingURL=MemoryAgent.js.map