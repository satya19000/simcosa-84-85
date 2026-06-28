import type * as admin from 'firebase-admin'
import { buildContext } from './ActionContext'
import type { ActionResult } from './ActionResult'
import { ToolExecutor } from './ToolExecutor'

export interface EngineRunOptions {
  toolName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>
  userId: string
  userDisplayName?: string
  db: admin.firestore.Firestore
}

/**
 * Public facade for the Action Engine.
 *
 * All Cloud Function handlers call ActionEngine.run() — never ToolExecutor directly.
 * This keeps the public API surface minimal and stable across phases.
 *
 * Example (from a Cloud Function):
 *   const result = await ActionEngine.run({
 *     toolName: 'createTask',
 *     args: { title: 'Call dentist', priority: 'high', dueAt: '2026-07-01T09:00:00Z' },
 *     userId: request.auth.uid,
 *     db: admin.firestore(),
 *   })
 */
export class ActionEngine {
  static async run<TData = unknown>(
    options: EngineRunOptions
  ): Promise<ActionResult<TData>> {
    const ctx = buildContext(options.userId, options.userDisplayName, options.db)
    const executor = new ToolExecutor(ctx)
    return executor.run<Record<string, unknown>, TData>(options.toolName, options.args)
  }

  /** Returns the list of all registered tool names — used to inject into ARIA system prompt. */
  static listTools(): string[] {
    const { registry } = require('./ActionRegistry') as typeof import('./ActionRegistry')
    return registry.listTools()
  }
}
