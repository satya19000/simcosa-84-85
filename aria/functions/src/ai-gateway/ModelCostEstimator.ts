import type { ModelDescriptor } from './ModelTypes'
import { TokenEstimator } from './TokenEstimator'

/**
 * Pure cost-estimation helpers. Never performs I/O — used by ModelRouter
 * (pre-flight cost ceiling checks) and ModelUsageTracker (post-flight
 * recorded cost) alike. Estimates are approximate (see ModelCatalog's
 * header comment); this is explicitly a simplistic guard, not metered
 * billing-grade accounting.
 */
export class ModelCostEstimator {
  private readonly tokenEstimator = new TokenEstimator()

  estimateForPrompt(model: ModelDescriptor, promptText: string, expectedOutputTokens = 512): number {
    const inputTokens = this.tokenEstimator.estimate(promptText)
    return this.estimate(model, inputTokens, expectedOutputTokens)
  }

  estimate(model: ModelDescriptor, inputTokens: number, outputTokens: number): number {
    return (inputTokens / 1000) * model.costPerKInputTokens + (outputTokens / 1000) * model.costPerKOutputTokens
  }

  exceedsCeiling(estimatedCostUsd: number, maxCostUsd: number | null | undefined): boolean {
    if (maxCostUsd == null) return false
    return estimatedCostUsd > maxCostUsd
  }
}
