"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserAgent = void 0;
/**
 * BrowserAgent — thin specialization of ComputerAgent for browser-context tasks.
 *
 * Routes browser-specific capability requests through the main ComputerAgent.
 * The BrowserExtensionProvider is used for capabilities that require an
 * extension (which is PLACEHOLDER — not yet implemented).
 */
class BrowserAgent {
    constructor(agent) {
        this.agent = agent;
    }
    /** Propose a browser-context action. Delegates to ComputerAgent.proposeAction. */
    async proposeBrowserAction(userId, tenantId, intent) {
        return this.agent.proposeAction(userId, tenantId, intent);
    }
}
exports.BrowserAgent = BrowserAgent;
//# sourceMappingURL=BrowserAgent.js.map