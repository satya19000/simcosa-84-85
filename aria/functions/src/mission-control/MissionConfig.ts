export interface MissionConfig {
  /** How many days ahead continuous planning looks for upcoming risks/conflicts. */
  planningHorizonDays: number
  /** Risk level -> requires ApprovalEngine gate before execution. */
  approvalRequiredForRiskLevel: Record<string, boolean>
  /** Minimum interval between scheduler runContinuousPlanning ticks, informational only (caller-driven). */
  schedulerCheckIntervalMs: number
  /** Max missions returned by any single queue listing call. */
  maxQueueSize: number
  /** Recommendations older than this are treated as expired. */
  recommendationExpiryMs: number
  /** Default mission expiry/deadline lookahead when none specified. */
  defaultDeadlineLookaheadMs: number
  /** Recommendations below this confidence are filtered out by default in listRecommendations. */
  minRecommendationConfidence: number
  /** LearningEngine clamps its confidence multiplier to this range. */
  minConfidenceAdjustment: number
  maxConfidenceAdjustment: number
  /** PredictionEngine / MissionAnalytics "at risk" window, in days, for missions nearing their targetDate. */
  atRiskWindowDays: number
}

// Risk bands mirror ApprovalPolicy's spirit but operate over MissionRiskLevel,
// not riskScore — Mission Control never invents its own approval math, it
// always defers the actual go/no-go decision to ApprovalPolicy/ApprovalEngine
// once a step requires approval (see MissionPolicies.ts).
export const DEFAULT_MISSION_CONFIG: MissionConfig = {
  planningHorizonDays: 7,
  approvalRequiredForRiskLevel: {
    low: false,
    medium: false,
    high: true,
    critical: true,
    emergency: true,
  },
  schedulerCheckIntervalMs: 30 * 60 * 1000, // 30 minutes
  maxQueueSize: 200,
  recommendationExpiryMs: 48 * 60 * 60 * 1000, // 48 hours
  defaultDeadlineLookaheadMs: 24 * 60 * 60 * 1000, // 24 hours
  minRecommendationConfidence: 0.4,
  minConfidenceAdjustment: 0.5,
  maxConfidenceAdjustment: 1.5,
  atRiskWindowDays: 7,
}
