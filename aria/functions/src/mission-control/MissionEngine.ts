import type * as admin from 'firebase-admin'
import type {
  Mission, MissionDomain, MissionPriority, MissionStatus, MissionStats,
  MissionTask, MissionTaskStatus, MissionRecommendation, MissionPrediction,
  LearningSnapshot, RecommendationSourceDomain,
} from './MissionTypes'
import type { MissionConfig } from './MissionConfig'
import type { CreateApprovalRequestInput } from '../delegation/ApprovalEngine'
import type { ApprovalRequest } from '../delegation/ApprovalTypes'
import type { FinanceEngine } from '../finance/FinanceEngine'
import type { HealthEngine } from '../health/HealthEngine'
import type { ApprovalEngine } from '../delegation/ApprovalEngine'
import { MissionManager } from './MissionManager'
import { MissionTaskManager } from './MissionTaskManager'
import { MissionPlanner, type PlanTaskInput } from './MissionPlanner'
import { MissionAnalytics } from './MissionAnalytics'
import { RecommendationManager } from './RecommendationManager'
import { RecommendationEngine } from './RecommendationEngine'
import { LearningEngine } from './LearningEngine'
import { PredictionManager } from './PredictionManager'
import { PredictionEngine } from './PredictionEngine'
import { ContinuousPlanningEngine, type PlanningRunSummary } from './ContinuousPlanningEngine'
import { MissionScheduler } from './MissionScheduler'
import { MissionApprovalBridge } from './MissionApprovalBridge'
import { MissionPermissions } from './MissionPermissions'
import { MissionHistory } from './MissionHistory'
import type { MissionHistoryEntry } from './MissionTypes'
import { MissionLogger } from './MissionLogger'
import { getMemoryGraph } from '../memory-graph'

/**
 * Facade orchestrating Mission Control end-to-end. Mirrors FinanceEngine /
 * ApprovalEngine's constructor signature and per-user singleton pattern
 * (see index.ts). Mission Control is purely additive: it reads from
 * FinanceEngine/HealthEngine/ApprovalEngine (passed in by the caller, never
 * constructed internally) and routes every risky action through
 * MissionApprovalBridge -> the real ApprovalEngine. It never writes
 * directly to Finance/Health collections and never bypasses ApprovalEngine.
 */
export class MissionEngine {
  private readonly missions: MissionManager
  private readonly tasks: MissionTaskManager
  private readonly planner: MissionPlanner
  private readonly analytics: MissionAnalytics
  private readonly recommendationStore: RecommendationManager
  private readonly recommendationEngine: RecommendationEngine
  private readonly learningEngine: LearningEngine
  private readonly predictionStore: PredictionManager
  private readonly predictionEngine: PredictionEngine
  private readonly planningEngine: ContinuousPlanningEngine
  private readonly scheduler: MissionScheduler
  private readonly permissions: MissionPermissions
  private readonly history: MissionHistory
  private readonly logger: MissionLogger

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly config: MissionConfig,
    private readonly apiKey: string,
    private readonly approvalEngine: ApprovalEngine
  ) {
    this.missions = new MissionManager(db)
    this.tasks = new MissionTaskManager(db)
    this.planner = new MissionPlanner(this.tasks)
    this.analytics = new MissionAnalytics(this.missions)
    this.recommendationStore = new RecommendationManager(db)
    this.learningEngine = new LearningEngine(db, config)
    this.recommendationEngine = new RecommendationEngine(this.recommendationStore, this.learningEngine)
    this.predictionStore = new PredictionManager(db)
    this.predictionEngine = new PredictionEngine(this.predictionStore, this.missions, this.tasks, config)
    this.planningEngine = new ContinuousPlanningEngine(this.missions, this.recommendationStore, this.recommendationEngine, this.predictionEngine, config)
    this.scheduler = new MissionScheduler(this.planningEngine)
    this.permissions = new MissionPermissions(db)
    this.history = new MissionHistory(db)
    this.logger = new MissionLogger(this.history)
    this.approvalBridge = new MissionApprovalBridge(approvalEngine, this.tasks)
  }

  private readonly approvalBridge: MissionApprovalBridge

  // ── Missions ──────────────────────────────────────────────────────────────

  async createMission(
    userId: string,
    fields: { title: string; description: string; domain: MissionDomain; priority: MissionPriority; targetDate?: string },
    plan?: PlanTaskInput[]
  ): Promise<{ mission: Mission; tasks: MissionTask[] }> {
    const mission = await this.missions.createMission(userId, fields)
    await this.logger.log(userId, { requestId: mission.id, actor: userId, action: 'mission_created' })
    void this.linkMissionToMemory(userId, mission)
    const tasks = await this.planner.applyPlan(userId, mission, plan)
    return { mission, tasks }
  }

  async getMission(userId: string, missionId: string): Promise<Mission | null> {
    return this.missions.getMission(userId, missionId)
  }

  async listMissions(userId: string, opts?: { status?: MissionStatus; domain?: MissionDomain; priority?: MissionPriority }): Promise<Mission[]> {
    return this.missions.listMissions(userId, opts ?? {})
  }

  async updateMission(userId: string, missionId: string, fields: Partial<Pick<Mission, 'title' | 'description' | 'priority' | 'targetDate' | 'status'>>): Promise<Mission | null> {
    const updated = await this.missions.updateMission(userId, missionId, fields)
    if (updated) await this.logger.log(userId, { requestId: missionId, actor: userId, action: 'mission_updated', details: fields })
    return updated
  }

  async activateMission(userId: string, missionId: string): Promise<Mission | null> {
    return this.updateMission(userId, missionId, { status: 'active' })
  }

  async pauseMission(userId: string, missionId: string): Promise<Mission | null> {
    return this.updateMission(userId, missionId, { status: 'paused' })
  }

  async abandonMission(userId: string, missionId: string, reason?: string): Promise<Mission | null> {
    const result = await this.missions.abandonMission(userId, missionId, reason)
    if (result) await this.logger.log(userId, { requestId: missionId, actor: userId, action: 'mission_abandoned', notes: reason })
    return result
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  async listTasks(userId: string, missionId: string): Promise<MissionTask[]> {
    return this.tasks.listTasksForMission(userId, missionId)
  }

  async addTask(userId: string, missionId: string, fields: { title: string; description?: string; order?: number; dependsOn?: string[] }): Promise<MissionTask> {
    const existing = await this.tasks.listTasksForMission(userId, missionId)
    return this.tasks.createTask(userId, {
      missionId,
      title: fields.title,
      description: fields.description,
      order: fields.order ?? existing.length,
      dependsOn: fields.dependsOn ?? [],
    })
  }

  /** Marks a task completed only if its declared dependencies are already complete, then recomputes mission progress. */
  async completeTask(userId: string, taskId: string): Promise<MissionTask | null> {
    const task = await this.tasks.getTask(userId, taskId)
    if (!task) return null
    const ready = await this.tasks.dependenciesSatisfied(userId, task)
    if (!ready) throw new Error(`Cannot complete task ${taskId}: unmet dependencies`)
    const updated = await this.tasks.setStatus(userId, taskId, 'completed')
    if (updated) {
      await this.logger.log(userId, { requestId: taskId, actor: userId, action: 'task_completed' })
      await this.recomputeProgress(userId, task.missionId)
    }
    return updated
  }

  async setTaskStatus(userId: string, taskId: string, status: MissionTaskStatus): Promise<MissionTask | null> {
    if (status === 'completed') return this.completeTask(userId, taskId)
    const updated = await this.tasks.setStatus(userId, taskId, status)
    if (updated) await this.recomputeProgress(userId, updated.missionId)
    return updated
  }

  private async recomputeProgress(userId: string, missionId: string): Promise<void> {
    const all = await this.tasks.listTasksForMission(userId, missionId)
    if (all.length === 0) return
    const completed = all.filter((t) => t.status === 'completed').length
    await this.missions.setProgress(userId, missionId, Math.round((completed / all.length) * 100))
  }

  // ── Approval Bridge (the ONLY path to risky action gating) ─────────────────

  async requestTaskApproval(userId: string, taskId: string, input: Omit<CreateApprovalRequestInput, 'createdBy'>): Promise<ApprovalRequest> {
    const task = await this.tasks.getTask(userId, taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    return this.approvalBridge.requestApprovalForTask(userId, task, input)
  }

  async getTaskApprovalStatus(userId: string, taskId: string): Promise<ApprovalRequest | null> {
    const task = await this.tasks.getTask(userId, taskId)
    if (!task) return null
    return this.approvalBridge.getLinkedApprovalStatus(userId, task)
  }

  // ── Recommendations ───────────────────────────────────────────────────────

  async listRecommendations(userId: string, minConfidence?: number): Promise<MissionRecommendation[]> {
    return this.recommendationEngine.listOpen(userId, minConfidence ?? this.config.minRecommendationConfidence)
  }

  async acceptRecommendation(userId: string, recommendationId: string, missionId: string): Promise<MissionRecommendation | null> {
    const result = await this.recommendationEngine.accept(userId, recommendationId, missionId)
    if (result) await this.logger.log(userId, { requestId: recommendationId, actor: userId, action: 'recommendation_accepted', details: { missionId } })
    return result
  }

  async dismissRecommendation(userId: string, recommendationId: string): Promise<MissionRecommendation | null> {
    const result = await this.recommendationEngine.dismiss(userId, recommendationId)
    if (result) await this.logger.log(userId, { requestId: recommendationId, actor: userId, action: 'recommendation_dismissed' })
    return result
  }

  // ── Predictions ───────────────────────────────────────────────────────────

  async getPredictionsForMission(userId: string, missionId: string): Promise<MissionPrediction[]> {
    const mission = await this.missions.getMission(userId, missionId)
    if (!mission) return []
    return this.predictionEngine.refreshAll(userId, mission)
  }

  // ── Learning ──────────────────────────────────────────────────────────────

  async getLearningSnapshot(userId: string, sourceDomain: RecommendationSourceDomain): Promise<LearningSnapshot> {
    return this.learningEngine.getSnapshot(userId, sourceDomain)
  }

  async getAllLearningSnapshots(userId: string): Promise<LearningSnapshot[]> {
    return this.learningEngine.getAllSnapshots(userId)
  }

  // ── Continuous Planning / Scheduler ──────────────────────────────────────

  async runPlanningCycle(
    userId: string,
    connected: { finance?: FinanceEngine; health?: HealthEngine; approvals?: ApprovalEngine } = {}
  ): Promise<PlanningRunSummary> {
    return this.scheduler.runAllChecks(userId, { approvals: this.approvalEngine, ...connected })
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats(userId: string): Promise<MissionStats> {
    return this.analytics.getStats(userId)
  }

  // ── History ───────────────────────────────────────────────────────────────

  async listHistory(userId: string, requestId?: string): Promise<MissionHistoryEntry[]> {
    if (requestId) return this.history.listForRequest(userId, requestId)
    return this.history.listAll(userId)
  }

  // ── Permissions passthrough ──────────────────────────────────────────────

  get permissionsApi(): MissionPermissions {
    return this.permissions
  }

  // ── Memory Graph Integration ──────────────────────────────────────────────

  private async linkMissionToMemory(userId: string, mission: Mission): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const { node } = await graph.upsertNode(
        'project',
        mission.title,
        `${mission.domain} mission: ${mission.description}`,
        { missionId: mission.id, status: mission.status },
        30
      )
      await this.missions.setMemoryNodeId(userId, mission.id, node.id)
    } catch {
      // best-effort
    }
  }
}
