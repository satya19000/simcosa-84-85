/** Unique string ID for each agent class. */
export type AgentId = string

/** Unique ID for a single agent task execution. */
export type AgentTaskId = string

/** Unique ID for an execution graph run. */
export type GraphRunId = string

// ── Agent capability declarations ─────────────────────────────────────────────

export type AgentCapability =
  | 'plan'
  | 'calendar'
  | 'tasks'
  | 'reminders'
  | 'contacts'
  | 'memory'
  | 'workflow'
  | 'notification'
  | 'voice'
  | 'briefing'
  | 'knowledge'
  | 'search'
  | 'validation'
  | 'email'       // placeholder
  | 'whatsapp'    // placeholder
  | 'maps'        // placeholder
  | 'finance'     // placeholder
  | 'health'      // placeholder
  | 'document'    // placeholder
  | 'ocr'         // placeholder
  | 'automation'  // placeholder

// ── Task / Node statuses ───────────────────────────────────────────────────────

export type AgentTaskStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'skipped'
  | 'cancelled'
  | 'validating'

// ── Agent runtime status ───────────────────────────────────────────────────────

export type AgentStatus =
  | 'unregistered'
  | 'initializing'
  | 'idle'
  | 'busy'
  | 'error'
  | 'disabled'
  | 'shutdown'

// ── Execution modes ────────────────────────────────────────────────────────────

export type ExecutionMode = 'sequential' | 'parallel' | 'pipeline'

// ── Routing strategy ──────────────────────────────────────────────────────────

export type RoutingStrategy = 'single' | 'parallel' | 'sequential' | 'fallback' | 'broadcast'

// ── Intent classification ─────────────────────────────────────────────────────

export interface IntentClassification {
  primary: AgentCapability
  secondary: AgentCapability[]
  confidence: number
  reasoning: string
  suggestedMode: ExecutionMode
}

// ── Validation result ─────────────────────────────────────────────────────────

export type ValidationOutcome = 'pass' | 'fail' | 'retry' | 'fallback' | 'ask_user'

export interface ValidationResult {
  outcome: ValidationOutcome
  issues: string[]
  confidence: number
  correctedOutput?: unknown
}
