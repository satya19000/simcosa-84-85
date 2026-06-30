import type { ComputerAgent } from './ComputerAgent'

/**
 * BrowserAgent — thin specialization of ComputerAgent for browser-context tasks.
 *
 * Routes browser-specific capability requests through the main ComputerAgent.
 * The BrowserExtensionProvider is used for capabilities that require an
 * extension (which is PLACEHOLDER — not yet implemented).
 */
export class BrowserAgent {
  constructor(private readonly agent: ComputerAgent) {}

  /** Propose a browser-context action. Delegates to ComputerAgent.proposeAction. */
  async proposeBrowserAction(userId: string, tenantId: string, intent: string) {
    return this.agent.proposeAction(userId, tenantId, intent)
  }
}
