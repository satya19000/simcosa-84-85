import type { StepType, RetryPolicy, ConditionLogic } from './WorkflowTypes'

/** Base fields every step must have. */
export interface BaseStep {
  id: string
  type: StepType
  name: string
  description?: string
  retryPolicy?: Partial<RetryPolicy>
  /** If true, failures are logged but workflow continues. */
  continueOnError?: boolean
  /** Only execute this step when condition holds. */
  condition?: ConditionLogic
  /** Output key written to WorkflowContext.vars after this step. */
  outputKey?: string
}

/** Run an Action Engine tool. */
export interface RunActionStep extends BaseStep {
  type: 'run_action'
  toolName: string
  args: Record<string, unknown>
}

/** Call a plugin tool. */
export interface RunPluginStep extends BaseStep {
  type: 'run_plugin'
  pluginId: string
  toolName: string
  args: Record<string, unknown>
}

/** Ask Claude to make a decision — result stored in outputKey. */
export interface RunAIStep extends BaseStep {
  type: 'run_ai'
  prompt: string
  maxTokens?: number
}

/** Conditional branching — execute thenSteps or elseSteps. */
export interface ConditionStep extends BaseStep {
  type: 'condition'
  condition: ConditionLogic
  thenSteps: WorkflowStep[]
  elseSteps?: WorkflowStep[]
}

/** Wait a fixed duration before continuing. */
export interface DelayStep extends BaseStep {
  type: 'delay'
  /** Delay in milliseconds. */
  durationMs: number
}

/** Execute a group of steps concurrently and wait for all to finish. */
export interface ParallelStep extends BaseStep {
  type: 'parallel'
  steps: WorkflowStep[]
}

/** Repeat steps while a condition holds or for a fixed count. */
export interface LoopStep extends BaseStep {
  type: 'loop'
  steps: WorkflowStep[]
  condition?: ConditionLogic
  /** Maximum iterations — guards against infinite loops. */
  maxIterations: number
}

/** Send a push notification to the user. */
export interface NotificationStep extends BaseStep {
  type: 'notification'
  title: string
  body: string
  data?: Record<string, string>
}

/** Generate a daily briefing document via the briefing engine. */
export interface GenerateBriefingStep extends BaseStep {
  type: 'generate_briefing'
  timezone?: string
}

/** Synthesise text to speech (no-op in Cloud Function — signals the client). */
export interface SpeakTextStep extends BaseStep {
  type: 'speak_text'
  /** Template — may reference context vars with {{varName}} syntax. */
  text: string
}

/** Escape hatch: run arbitrary async logic registered by plugins. */
export interface CustomStep extends BaseStep {
  type: 'custom'
  handler: string
  args?: Record<string, unknown>
}

export type WorkflowStep =
  | RunActionStep
  | RunPluginStep
  | RunAIStep
  | ConditionStep
  | DelayStep
  | ParallelStep
  | LoopStep
  | NotificationStep
  | GenerateBriefingStep
  | SpeakTextStep
  | CustomStep
