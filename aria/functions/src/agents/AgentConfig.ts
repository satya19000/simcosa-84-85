export interface AgentConfig {
  /** Max concurrent tasks this agent will accept. */
  maxConcurrency: number
  /** Per-task timeout in milliseconds. */
  taskTimeoutMs: number
  /** Max retry attempts per task. */
  maxRetries: number
  /** Delay between retries (ms). Doubles each attempt. */
  retryDelayMs: number
  /** In-memory cache TTL in milliseconds. */
  cacheTTLMs: number
  /** Whether detailed debug logs are emitted. */
  debugMode: boolean
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxConcurrency: 5,
  taskTimeoutMs: 30_000,
  maxRetries: 2,
  retryDelayMs: 1_000,
  cacheTTLMs: 60_000,
  debugMode: false,
}

export function resolveAgentConfig(override?: Partial<AgentConfig>): AgentConfig {
  return { ...DEFAULT_AGENT_CONFIG, ...override }
}
