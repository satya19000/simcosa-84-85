import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getMissionEngine } from './mission-control'
import { getFinanceEngine } from './finance'
import { getHealthEngine } from './health'
import { getApprovalEngine } from './delegation'
import { MissionValidator, MissionValidationError } from './mission-control/MissionValidator'
import type { MissionDomain, MissionPriority, MissionStatus, MissionTaskStatus, RecommendationSourceDomain } from './mission-control/MissionTypes'
import type { PlanTaskInput } from './mission-control/MissionPlanner'
import type { ApprovalActionDescriptor, ApprovalTriggerType, RiskFactors } from './delegation/ApprovalTypes'

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? ''
}

function requireAuth(request: { auth?: { uid: string } | null }): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  return request.auth.uid
}

function wrapValidation<T>(fn: () => T): T {
  try {
    return fn()
  } catch (err) {
    if (err instanceof MissionValidationError) throw new HttpsError('invalid-argument', err.message)
    throw err
  }
}

// ── Missions ──────────────────────────────────────────────────────────────────

export const createMission = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as {
      title: string; description: string; domain: MissionDomain; priority: MissionPriority
      targetDate?: string; plan?: PlanTaskInput[]
    }
    wrapValidation(() => MissionValidator.validateCreateMission(data))
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.createMission(uid, {
      title: data.title,
      description: data.description ?? '',
      domain: data.domain ?? 'general',
      priority: data.priority ?? 'medium',
      targetDate: data.targetDate,
    }, data.plan)
  }
)

export const getMission = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { missionId } = request.data as { missionId: string }
    if (!missionId) throw new HttpsError('invalid-argument', 'missionId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.getMission(uid, missionId)
  }
)

export const listMissions = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const opts = (request.data ?? {}) as { status?: MissionStatus; domain?: MissionDomain; priority?: MissionPriority }
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.listMissions(uid, opts)
  }
)

export const updateMission = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { missionId, ...fields } = request.data as { missionId: string; title?: string; description?: string; priority?: MissionPriority; targetDate?: string; status?: MissionStatus }
    if (!missionId) throw new HttpsError('invalid-argument', 'missionId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.updateMission(uid, missionId, fields)
  }
)

export const activateMission = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { missionId } = request.data as { missionId: string }
    if (!missionId) throw new HttpsError('invalid-argument', 'missionId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.activateMission(uid, missionId)
  }
)

export const pauseMission = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { missionId } = request.data as { missionId: string }
    if (!missionId) throw new HttpsError('invalid-argument', 'missionId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.pauseMission(uid, missionId)
  }
)

export const abandonMission = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { missionId, reason } = request.data as { missionId: string; reason?: string }
    if (!missionId) throw new HttpsError('invalid-argument', 'missionId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.abandonMission(uid, missionId, reason)
  }
)

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const listMissionTasks = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { missionId } = request.data as { missionId: string }
    if (!missionId) throw new HttpsError('invalid-argument', 'missionId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.listTasks(uid, missionId)
  }
)

export const addMissionTask = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { missionId: string; title: string; description?: string; order?: number; dependsOn?: string[] }
    wrapValidation(() => MissionValidator.validateCreateTask(data))
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.addTask(uid, data.missionId, data)
  }
)

export const completeMissionTask = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { taskId } = request.data as { taskId: string }
    if (!taskId) throw new HttpsError('invalid-argument', 'taskId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    try {
      return await engine.completeTask(uid, taskId)
    } catch (err) {
      throw new HttpsError('failed-precondition', err instanceof Error ? err.message : 'Cannot complete task')
    }
  }
)

export const setMissionTaskStatus = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { taskId, status } = request.data as { taskId: string; status: MissionTaskStatus }
    if (!taskId || !status) throw new HttpsError('invalid-argument', 'taskId and status required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.setTaskStatus(uid, taskId, status)
  }
)

// ── Approval Bridge ───────────────────────────────────────────────────────────

export const requestMissionTaskApproval = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as {
      taskId: string; title: string; summary: string; reason: string
      triggerType: ApprovalTriggerType; actions: ApprovalActionDescriptor[]; rollbackPlan: string
      estimatedDurationMs?: number; riskFactors: RiskFactors; expiresInMs?: number
    }
    if (!data?.taskId || !data?.title || !data?.triggerType || !data?.riskFactors) {
      throw new HttpsError('invalid-argument', 'taskId, title, triggerType, and riskFactors are required')
    }
    const engine = getMissionEngine(uid, db(), apiKey())
    const { taskId, ...approvalInput } = data
    return engine.requestTaskApproval(uid, taskId, approvalInput)
  }
)

export const getMissionTaskApprovalStatus = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { taskId } = request.data as { taskId: string }
    if (!taskId) throw new HttpsError('invalid-argument', 'taskId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.getTaskApprovalStatus(uid, taskId)
  }
)

// ── Recommendations ───────────────────────────────────────────────────────────

export const listMissionRecommendations = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { minConfidence } = (request.data ?? {}) as { minConfidence?: number }
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.listRecommendations(uid, minConfidence)
  }
)

export const acceptMissionRecommendation = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { recommendationId, missionId } = request.data as { recommendationId: string; missionId: string }
    if (!recommendationId || !missionId) throw new HttpsError('invalid-argument', 'recommendationId and missionId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.acceptRecommendation(uid, recommendationId, missionId)
  }
)

export const dismissMissionRecommendation = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { recommendationId } = request.data as { recommendationId: string }
    if (!recommendationId) throw new HttpsError('invalid-argument', 'recommendationId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.dismissRecommendation(uid, recommendationId)
  }
)

// ── Predictions ────────────────────────────────────────────────────────────────

export const getMissionPredictions = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { missionId } = request.data as { missionId: string }
    if (!missionId) throw new HttpsError('invalid-argument', 'missionId required')
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.getPredictionsForMission(uid, missionId)
  }
)

// ── Learning ──────────────────────────────────────────────────────────────────

export const getMissionLearningSnapshots = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { sourceDomain } = (request.data ?? {}) as { sourceDomain?: RecommendationSourceDomain }
    const engine = getMissionEngine(uid, db(), apiKey())
    return sourceDomain ? [await engine.getLearningSnapshot(uid, sourceDomain)] : engine.getAllLearningSnapshots(uid)
  }
)

// ── Continuous Planning ───────────────────────────────────────────────────────

export const runMissionPlanningCycle = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    const uid = requireAuth(request)
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.runPlanningCycle(uid, {
      finance: getFinanceEngine(uid, db(), apiKey()),
      health: getHealthEngine(uid, db(), apiKey()),
      approvals: getApprovalEngine(uid, db(), apiKey()),
    })
  }
)

// ── Stats / History ────────────────────────────────────────────────────────────

export const getMissionStats = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.getStats(uid)
  }
)

export const listMissionHistory = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { requestId } = (request.data ?? {}) as { requestId?: string }
    const engine = getMissionEngine(uid, db(), apiKey())
    return engine.listHistory(uid, requestId)
  }
)
