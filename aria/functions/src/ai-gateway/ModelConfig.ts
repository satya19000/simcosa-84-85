export interface AIGatewayConfig {
  /** Master kill-switch. When false, chatWithAriaGateway still works but routes only to Claude (today's behaviour). */
  enableAIGateway: boolean
  /** Enables `raw` field on NormalizedResponse and verbose logging. Must default false — never log prompts otherwise. */
  debugMode: boolean
  /** Hard ceiling applied to every single request regardless of policy, as a last-resort guard against unbounded spend. */
  hardMaxCostPerRequestUsd: number
  defaultTimeoutMs: number
  fallbackMaxAttempts: number
}

export const DEFAULT_AI_GATEWAY_CONFIG: AIGatewayConfig = {
  enableAIGateway: false,
  debugMode: false,
  hardMaxCostPerRequestUsd: 2.0,
  defaultTimeoutMs: 60_000,
  fallbackMaxAttempts: 2,
}
