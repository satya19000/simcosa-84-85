import type { BaseAction } from './BaseAction'
import { ToolNotFoundError } from './Errors'

/**
 * Central registry of all ARIA tools.
 *
 * Actions self-register at module load time via register().
 * ToolExecutor resolves by name — no switch, no if-chains.
 * Singleton: one instance per Cloud Function cold start.
 */
export class ActionRegistry {
  private static instance: ActionRegistry | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly actions = new Map<string, BaseAction<any, any>>()

  private constructor() {}

  static getInstance(): ActionRegistry {
    if (!ActionRegistry.instance) {
      ActionRegistry.instance = new ActionRegistry()
    }
    return ActionRegistry.instance
  }

  /**
   * Register an action. Called once per action class at module load time.
   * Throws if the same toolName is registered twice (catches copy-paste bugs).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(action: BaseAction<any, any>): void {
    if (this.actions.has(action.toolName)) {
      throw new Error(
        `ActionRegistry: duplicate tool name '${action.toolName}'. Each tool must have a unique name.`
      )
    }
    this.actions.set(action.toolName, action)
  }

  /**
   * Resolve an action by name.
   * Throws ToolNotFoundError — never returns undefined.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve(toolName: string): BaseAction<any, any> {
    const action = this.actions.get(toolName)
    if (!action) throw new ToolNotFoundError(toolName)
    return action
  }

  /** Returns all registered tool names — useful for system prompt injection. */
  listTools(): string[] {
    return Array.from(this.actions.keys()).sort()
  }

  /** Returns true if the given name is registered. */
  has(toolName: string): boolean {
    return this.actions.has(toolName)
  }
}

/** Module-level singleton accessor — import this everywhere instead of constructing directly. */
export const registry = ActionRegistry.getInstance()
