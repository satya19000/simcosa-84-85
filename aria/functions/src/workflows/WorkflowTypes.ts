/** Unique ID for a workflow definition. */
export type WorkflowId = string

/** Unique ID for a single execution run. */
export type ExecutionId = string

// ── Trigger Types ─────────────────────────────────────────────────────────────

export type TriggerType =
  | 'manual'
  | 'scheduled'
  | 'reminder_triggered'
  | 'task_completed'
  | 'voice_command'
  | 'chat_intent'
  | 'plugin_event'
  | 'webhook'

export interface ManualTrigger { type: 'manual' }
export interface ScheduledTrigger { type: 'scheduled'; cron: string; timezone?: string }
export interface ReminderTrigger { type: 'reminder_triggered'; reminderTitle?: string }
export interface TaskCompletedTrigger { type: 'task_completed'; taskTitle?: string }
export interface VoiceCommandTrigger { type: 'voice_command'; phrase: string }
export interface ChatIntentTrigger { type: 'chat_intent'; intentKeywords: string[] }
export interface PluginEventTrigger { type: 'plugin_event'; eventName: string; pluginId?: string }
export interface WebhookTrigger { type: 'webhook'; path: string }

export type WorkflowTrigger =
  | ManualTrigger
  | ScheduledTrigger
  | ReminderTrigger
  | TaskCompletedTrigger
  | VoiceCommandTrigger
  | ChatIntentTrigger
  | PluginEventTrigger
  | WebhookTrigger

// ── Step Types ────────────────────────────────────────────────────────────────

export type StepType =
  | 'run_action'
  | 'run_plugin'
  | 'run_ai'
  | 'condition'
  | 'delay'
  | 'parallel'
  | 'loop'
  | 'notification'
  | 'generate_briefing'
  | 'speak_text'
  | 'custom'

// ── Retry Policy ──────────────────────────────────────────────────────────────

export interface RetryPolicy {
  maxAttempts: number
  delayMs: number
  backoffMultiplier: number
  timeoutMs: number
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  timeoutMs: 30_000,
}

// ── Condition Expressions ─────────────────────────────────────────────────────

export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'exists' | 'not_exists' | 'contains'

export interface ConditionExpr {
  field: string
  operator: ConditionOperator
  value?: unknown
}

export type ConditionLogic = { and: ConditionExpr[] } | { or: ConditionExpr[] } | ConditionExpr

// ── Execution Status ──────────────────────────────────────────────────────────

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'retrying'
