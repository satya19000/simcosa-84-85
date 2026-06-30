// ── Shared Mission Control Types ────────────────────────────────────────────
// Phase 5.0: cross-domain executive planning layer. A "Mission" is a
// goal-level container; "MissionTasks" are the concrete steps. Mission
// Control does not duplicate Finance/Health/Delegation — it reads their
// stats/suggestions to generate Recommendations and routes any risky
// action through the real ApprovalEngine (see MissionApprovalBridge.ts).

export type MissionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'abandoned'
export type MissionPriority = 'low' | 'medium' | 'high' | 'critical'
export type MissionDomain = 'finance' | 'health' | 'delegation' | 'communication' | 'general'

export interface Mission {
  id: string
  userId: string
  title: string
  description: string
  domain: MissionDomain
  status: MissionStatus
  priority: MissionPriority
  targetDate?: string
  progress: number // 0-100, derived from task completion
  memoryNodeId?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type MissionTaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'

export interface MissionTask {
  id: string
  userId: string
  missionId: string
  title: string
  description?: string
  status: MissionTaskStatus
  order: number
  dependsOn: string[]
  approvalRequestId?: string // set when this task required ApprovalEngine gating
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// ── Recommendations ─────────────────────────────────────────────────────────

export type RecommendationSourceDomain = MissionDomain
export type RecommendationStatus = 'open' | 'accepted' | 'dismissed' | 'expired'

export interface MissionRecommendation {
  id: string
  userId: string
  title: string
  rationale: string
  sourceDomain: RecommendationSourceDomain
  sourceRef?: string // e.g. budgetId, invoiceId, approvalRequestId
  confidence: number // 0-1, adjusted over time by LearningEngine
  impactScore: number // 0-100 heuristic
  status: RecommendationStatus
  missionId?: string // set if accepted into a mission
  createdAt: string
  updatedAt: string
}

// ── Predictions ──────────────────────────────────────────────────────────────

export type PredictionKind = 'mission_completion_eta' | 'budget_overrun_risk' | 'task_slippage_risk'

export interface MissionPrediction {
  id: string
  userId: string
  kind: PredictionKind
  targetId: string // missionId or taskId
  value: number // interpretation depends on kind (days, 0-1 probability, etc.)
  confidence: number // 0-1
  basis: string // short human-readable explanation of inputs used
  generatedAt: string
}

// ── Learning ─────────────────────────────────────────────────────────────────

export interface RecommendationOutcome {
  id: string
  userId: string
  recommendationId: string
  sourceDomain: RecommendationSourceDomain
  accepted: boolean
  recordedAt: string
}

export interface LearningSnapshot {
  sourceDomain: RecommendationSourceDomain
  totalShown: number
  totalAccepted: number
  acceptanceRate: number
  confidenceAdjustment: number // multiplier applied to future confidence (0.5-1.5)
}

// ── Stats ────────────────────────────────────────────────────────────────────

export interface MissionStats {
  totalMissions: number
  byStatus: Record<MissionStatus, number>
  byDomain: Record<MissionDomain, number>
  avgProgress: number
  completedThisMonth: number
  overdue: number
}

export type MissionEventName =
  | 'mission:created' | 'mission:updated' | 'mission:completed' | 'mission:abandoned'
  | 'task:created' | 'task:completed' | 'task:blocked'
  | 'recommendation:created' | 'recommendation:accepted' | 'recommendation:dismissed'
  | 'prediction:generated'

export interface MissionEvent<T = unknown> {
  name: MissionEventName
  userId: string
  payload: T
  emittedAt: string
}

export type MissionRole = 'reader' | 'planner' | 'mission_admin' | 'admin'

export interface MissionPermissionRecord {
  userId: string
  scopeId: string
  role: MissionRole
  grantedAt: string
}

// ── History ──────────────────────────────────────────────────────────────────

export interface MissionHistoryEntry {
  id: string
  requestId: string
  missionId?: string
  action: string
  actor: string
  notes?: string
  details?: Record<string, unknown>
  at: string
}
