import type * as admin from 'firebase-admin'
import type { AgentId, AgentTaskId, GraphRunId } from './AgentTypes'

/**
 * Immutable context passed to every agent method.
 * Agents never hold a raw Firestore reference — all writes go through ActionEngine.
 * This context is read-only; agents may only query, never mutate directly.
 */
export interface AgentContext {
  /** Authenticated user this task belongs to. */
  readonly userId: string
  readonly userDisplayName?: string

  /** Firestore for read-only queries. Agents MUST NOT write directly. */
  readonly db: admin.firestore.Firestore

  /** Claude API key for agents that call the model. */
  readonly apiKey: string

  /** Which graph run this task belongs to. */
  readonly graphRunId: GraphRunId

  /** This specific task's ID. */
  readonly taskId: AgentTaskId

  /** The agent executing this task. */
  readonly agentId: AgentId

  /** Shared key-value store for the graph run — read outputs of upstream agents here. */
  readonly sharedVars: Record<string, unknown>

  /** Trigger payload from whatever initiated the graph. */
  readonly triggerPayload?: Record<string, unknown>

  /** ISO timestamp this task was created. */
  readonly createdAt: string
}
