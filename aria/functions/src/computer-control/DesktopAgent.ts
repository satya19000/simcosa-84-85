import type { ComputerAgent } from './ComputerAgent'

/**
 * DesktopAgent — thin specialization of ComputerAgent for desktop OS tasks.
 *
 * All desktop capabilities require the DesktopAgentProvider, which is a
 * PLACEHOLDER — no native app or agent binary exists.
 * All method calls are routed through ComputerAgent and will return
 * structured "not implemented" results via DesktopAgentProvider.
 */
export class DesktopAgent {
  constructor(private readonly agent: ComputerAgent) {}

  /** Propose a desktop action. Delegates to ComputerAgent.proposeAction. */
  async proposeDesktopAction(userId: string, tenantId: string, intent: string) {
    return this.agent.proposeAction(userId, tenantId, intent)
  }
}
