import type { ComputerProviderType } from './ComputerTypes'

export interface ComputerControlConfig {
  /** Default provider for web-context operations. */
  defaultProvider: ComputerProviderType
  /** Maximum number of steps allowed in a single action plan. */
  maxPlanSteps: number
  /** Default session TTL in milliseconds. */
  sessionTtlMs: number
  /** If true, all capabilities require approval regardless of risk level. */
  requireApprovalForAll: boolean
  /** If true, enable observability logging. */
  enableObservability: boolean
}

export const DEFAULT_COMPUTER_CONTROL_CONFIG: ComputerControlConfig = {
  defaultProvider: 'web-pwa',
  maxPlanSteps: 10,
  sessionTtlMs: 60 * 60 * 1000, // 1 hour
  requireApprovalForAll: false,
  enableObservability: true,
}
