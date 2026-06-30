import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const createMissionFn = httpsCallable(fns, 'createMission')
const getMissionFn = httpsCallable(fns, 'getMission')
const listMissionsFn = httpsCallable(fns, 'listMissions')
const updateMissionFn = httpsCallable(fns, 'updateMission')
const activateMissionFn = httpsCallable(fns, 'activateMission')
const pauseMissionFn = httpsCallable(fns, 'pauseMission')
const abandonMissionFn = httpsCallable(fns, 'abandonMission')
const listMissionTasksFn = httpsCallable(fns, 'listMissionTasks')
const addMissionTaskFn = httpsCallable(fns, 'addMissionTask')
const completeMissionTaskFn = httpsCallable(fns, 'completeMissionTask')
const setMissionTaskStatusFn = httpsCallable(fns, 'setMissionTaskStatus')
const requestMissionTaskApprovalFn = httpsCallable(fns, 'requestMissionTaskApproval')
const getMissionTaskApprovalStatusFn = httpsCallable(fns, 'getMissionTaskApprovalStatus')
const listMissionRecommendationsFn = httpsCallable(fns, 'listMissionRecommendations')
const acceptMissionRecommendationFn = httpsCallable(fns, 'acceptMissionRecommendation')
const dismissMissionRecommendationFn = httpsCallable(fns, 'dismissMissionRecommendation')
const getMissionPredictionsFn = httpsCallable(fns, 'getMissionPredictions')
const getMissionLearningSnapshotsFn = httpsCallable(fns, 'getMissionLearningSnapshots')
const runMissionPlanningCycleFn = httpsCallable(fns, 'runMissionPlanningCycle')
const getMissionStatsFn = httpsCallable(fns, 'getMissionStats')
const listMissionHistoryFn = httpsCallable(fns, 'listMissionHistory')

// ── Types (mirror aria/functions/src/mission-control/MissionTypes.ts) ────────

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
  progress: number
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
  approvalRequestId?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type RecommendationSourceDomain = MissionDomain
export type RecommendationStatus = 'open' | 'accepted' | 'dismissed' | 'expired'

export interface MissionRecommendation {
  id: string
  userId: string
  title: string
  rationale: string
  sourceDomain: RecommendationSourceDomain
  sourceRef?: string
  confidence: number
  impactScore: number
  status: RecommendationStatus
  missionId?: string
  createdAt: string
  updatedAt: string
}

export type PredictionKind = 'mission_completion_eta' | 'budget_overrun_risk' | 'task_slippage_risk'

export interface MissionPrediction {
  id: string
  userId: string
  kind: PredictionKind
  targetId: string
  value: number
  confidence: number
  basis: string
  generatedAt: string
}

export interface LearningSnapshot {
  sourceDomain: RecommendationSourceDomain
  totalShown: number
  totalAccepted: number
  acceptanceRate: number
  confidenceAdjustment: number
}

export interface MissionStats {
  totalMissions: number
  byStatus: Record<MissionStatus, number>
  byDomain: Record<MissionDomain, number>
  avgProgress: number
  completedThisMonth: number
  overdue: number
}

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

export interface PlanTaskInput {
  title: string
  description?: string
  dependsOnIndexes?: number[]
}

export interface PlanningRunSummary {
  recommendationsCreated: number
  predictionsGenerated: number
  recommendationsExpired: number
  ranAt: string
}

export type ApprovalTriggerType =
  | 'send_email' | 'send_whatsapp' | 'delete_documents' | 'delete_contacts'
  | 'delete_memories' | 'financial_payment' | 'medical_decision'
  | 'health_record_update' | 'bulk_operation' | 'external_api_call' | 'plugin_installation'

export interface ApprovalActionDescriptor {
  id: string
  description: string
  target?: string
  payload?: Record<string, unknown>
}

export interface RiskFactors {
  externalCommunication: boolean
  financialImpact: number
  healthImpact: boolean
  privacyImpact: boolean
  irreversible: boolean
  aiConfidence: number
}

export interface ApprovalRequest {
  id: string
  userId: string
  title: string
  status: string
  riskScore: number
  approvalLevel: string
  [key: string]: unknown
}

// ── Missions ─────────────────────────────────────────────────────────────────

export async function createMission(input: {
  title: string; description: string; domain: MissionDomain; priority: MissionPriority
  targetDate?: string; plan?: PlanTaskInput[]
}): Promise<{ mission: Mission; tasks: MissionTask[] }> {
  const result = await createMissionFn(input)
  return result.data as { mission: Mission; tasks: MissionTask[] }
}

export async function getMission(missionId: string): Promise<Mission | null> {
  const result = await getMissionFn({ missionId })
  return result.data as Mission | null
}

export async function listMissions(opts?: { status?: MissionStatus; domain?: MissionDomain; priority?: MissionPriority }): Promise<Mission[]> {
  const result = await listMissionsFn(opts ?? {})
  return result.data as Mission[]
}

export async function updateMission(missionId: string, fields: Partial<Pick<Mission, 'title' | 'description' | 'priority' | 'targetDate' | 'status'>>): Promise<Mission | null> {
  const result = await updateMissionFn({ missionId, ...fields })
  return result.data as Mission | null
}

export async function activateMission(missionId: string): Promise<Mission | null> {
  const result = await activateMissionFn({ missionId })
  return result.data as Mission | null
}

export async function pauseMission(missionId: string): Promise<Mission | null> {
  const result = await pauseMissionFn({ missionId })
  return result.data as Mission | null
}

export async function abandonMission(missionId: string, reason?: string): Promise<Mission | null> {
  const result = await abandonMissionFn({ missionId, reason })
  return result.data as Mission | null
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function listMissionTasks(missionId: string): Promise<MissionTask[]> {
  const result = await listMissionTasksFn({ missionId })
  return result.data as MissionTask[]
}

export async function addMissionTask(missionId: string, fields: { title: string; description?: string; order?: number; dependsOn?: string[] }): Promise<MissionTask> {
  const result = await addMissionTaskFn({ missionId, ...fields })
  return result.data as MissionTask
}

export async function completeMissionTask(taskId: string): Promise<MissionTask | null> {
  const result = await completeMissionTaskFn({ taskId })
  return result.data as MissionTask | null
}

export async function setMissionTaskStatus(taskId: string, status: MissionTaskStatus): Promise<MissionTask | null> {
  const result = await setMissionTaskStatusFn({ taskId, status })
  return result.data as MissionTask | null
}

// ── Approval Bridge ──────────────────────────────────────────────────────────

export async function requestMissionTaskApproval(taskId: string, input: {
  title: string; summary: string; reason: string; triggerType: ApprovalTriggerType
  actions: ApprovalActionDescriptor[]; rollbackPlan: string; estimatedDurationMs?: number
  riskFactors: RiskFactors; expiresInMs?: number
}): Promise<ApprovalRequest> {
  const result = await requestMissionTaskApprovalFn({ taskId, ...input })
  return result.data as ApprovalRequest
}

export async function getMissionTaskApprovalStatus(taskId: string): Promise<ApprovalRequest | null> {
  const result = await getMissionTaskApprovalStatusFn({ taskId })
  return result.data as ApprovalRequest | null
}

// ── Recommendations ──────────────────────────────────────────────────────────

export async function listMissionRecommendations(minConfidence?: number): Promise<MissionRecommendation[]> {
  const result = await listMissionRecommendationsFn({ minConfidence })
  return result.data as MissionRecommendation[]
}

export async function acceptMissionRecommendation(recommendationId: string, missionId: string): Promise<MissionRecommendation | null> {
  const result = await acceptMissionRecommendationFn({ recommendationId, missionId })
  return result.data as MissionRecommendation | null
}

export async function dismissMissionRecommendation(recommendationId: string): Promise<MissionRecommendation | null> {
  const result = await dismissMissionRecommendationFn({ recommendationId })
  return result.data as MissionRecommendation | null
}

// ── Predictions ──────────────────────────────────────────────────────────────

export async function getMissionPredictions(missionId: string): Promise<MissionPrediction[]> {
  const result = await getMissionPredictionsFn({ missionId })
  return result.data as MissionPrediction[]
}

// ── Learning ─────────────────────────────────────────────────────────────────

export async function getMissionLearningSnapshots(sourceDomain?: RecommendationSourceDomain): Promise<LearningSnapshot[]> {
  const result = await getMissionLearningSnapshotsFn({ sourceDomain })
  return result.data as LearningSnapshot[]
}

// ── Continuous Planning ──────────────────────────────────────────────────────

export async function runMissionPlanningCycle(): Promise<PlanningRunSummary> {
  const result = await runMissionPlanningCycleFn({})
  return result.data as PlanningRunSummary
}

// ── Stats / History ──────────────────────────────────────────────────────────

export async function getMissionStats(): Promise<MissionStats> {
  const result = await getMissionStatsFn({})
  return result.data as MissionStats
}

export async function listMissionHistory(requestId?: string): Promise<MissionHistoryEntry[]> {
  const result = await listMissionHistoryFn(requestId ? { requestId } : {})
  return result.data as MissionHistoryEntry[]
}
