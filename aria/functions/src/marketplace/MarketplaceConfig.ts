export interface MarketplaceConfig {
  /** Score (0-100) at/above which an install requires approval, mirroring ApprovalPolicy bands. */
  approvalRequiredScoreThreshold: number
  /** Score (0-100) at/above which an install is blocked outright pending manual review. */
  blockedScoreThreshold: number
  maxScreenshots: number
  maxCapabilities: number
}

export const DEFAULT_MARKETPLACE_CONFIG: MarketplaceConfig = {
  approvalRequiredScoreThreshold: 35,
  blockedScoreThreshold: 85,
  maxScreenshots: 8,
  maxCapabilities: 20,
}
