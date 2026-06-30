"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesktopAgent = void 0;
/**
 * DesktopAgent — thin specialization of ComputerAgent for desktop OS tasks.
 *
 * All desktop capabilities require the DesktopAgentProvider, which is a
 * PLACEHOLDER — no native app or agent binary exists.
 * All method calls are routed through ComputerAgent and will return
 * structured "not implemented" results via DesktopAgentProvider.
 */
class DesktopAgent {
    constructor(agent) {
        this.agent = agent;
    }
    /** Propose a desktop action. Delegates to ComputerAgent.proposeAction. */
    async proposeDesktopAction(userId, tenantId, intent) {
        return this.agent.proposeAction(userId, tenantId, intent);
    }
}
exports.DesktopAgent = DesktopAgent;
//# sourceMappingURL=DesktopAgent.js.map