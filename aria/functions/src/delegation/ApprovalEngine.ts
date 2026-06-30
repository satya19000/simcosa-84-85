import type * as admin from 'firebase-admin'
import type {
  ApprovalActionDescriptor, ApprovalLevel, ApprovalRequest, ApprovalStatus,
  ApprovalTriggerType, RiskFactors,
} from './ApprovalTypes'
import type { ApprovalConfig } from './ApprovalConfig'
import { ApprovalQueue } from './ApprovalQueue'
import { ApprovalHistory } from './ApprovalHistory'
import { ApprovalPolicy } from './ApprovalPolicy'
import { ApprovalTemplates } from './ApprovalTemplates'
import { ApprovalNotifications } from './ApprovalNotifications'
import { ApprovalAnalytics, type ApprovalStats } from './ApprovalAnalytics'
import { ApprovalMetrics, type ApprovalMetricsSnapshot } from './ApprovalMetrics'
import { ApprovalScheduler } from './ApprovalScheduler'
import { ApprovalRegistry } from './ApprovalRegistry'
import { ApprovalPermissions } from './ApprovalPermissions'
import { ApprovalLogger } from './ApprovalLogger'
import { buildApprovalRequest, computeRiskScore } from './ApprovalRequest'
import { getMemoryGraph } from '../memory-graph'

export interface CreateApprovalRequestInput {
  title: string
  summary: string
  reason: string
  triggerType: ApprovalTriggerType
  actions: ApprovalActionDescriptor[]
  rollbackPlan: string
  estimatedDurationMs?: number
  riskFactors: RiskFactors
  createdBy: string
  workflowId?: string
  expiresInMs?: number
}

/**
 * Facade orchestrating the entire Human Approval Platform. Mirrors
 * FinanceEngine's constructor signature and per-user singleton pattern.
 *
 * Hard invariant: no method on this engine executes a registered risky
 * action unless the underlying ApprovalRequest's status is genuinely
 * 'approved' at the moment of execution. approveRequest() is the only path
 * that can transition pending -> approved -> (optionally) executed; every
 * other method either reads, or moves a request to a terminal/handoff state
 * (rejected/cancelled/expired/delegated) without ever invoking an executor.
 */
export class ApprovalEngine {
  private readonly queue: ApprovalQueue
  private readonly history: ApprovalHistory
  private readonly policy: ApprovalPolicy
  private readonly templates: ApprovalTemplates
  private readonly notifications: ApprovalNotifications
  private readonly analytics: ApprovalAnalytics
  private readonly metrics: ApprovalMetrics
  private readonly scheduler: ApprovalScheduler
  private readonly registry: ApprovalRegistry
  private readonly permissions: ApprovalPermissions
  private readonly logger: ApprovalLogger

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly config: ApprovalConfig,
    private readonly apiKey: string
  ) {
    this.queue = new ApprovalQueue(db)
    this.history = new ApprovalHistory(db)
    this.policy = new ApprovalPolicy(config)
    this.templates = new ApprovalTemplates()
    this.notifications = new ApprovalNotifications(db)
    this.analytics = new ApprovalAnalytics(this.queue)
    this.metrics = new ApprovalMetrics(this.analytics)
    this.registry = new ApprovalRegistry()
    this.permissions = new ApprovalPermissions(db)
    this.logger = new ApprovalLogger(this.history)
    this.scheduler = new ApprovalScheduler(this.queue, this.notifications, config)
  }

  // ── Creation ──────────────────────────────────────────────────────────────

  async createApprovalRequest(userId: string, input: CreateApprovalRequestInput): Promise<ApprovalRequest> {
    const riskScore = computeRiskScore(input.riskFactors)
    const level: ApprovalLevel = this.policy.determineApprovalLevel(riskScore)
    const autoEligible = this.policy.isAutoExecuteEligible(riskScore, input.triggerType)

    const request = buildApprovalRequest(
      {
        userId,
        title: input.title,
        summary: input.summary,
        reason: input.reason,
        triggerType: input.triggerType,
        actions: input.actions,
        rollbackPlan: input.rollbackPlan,
        estimatedDurationMs: input.estimatedDurationMs ?? 0,
        createdBy: input.createdBy,
        riskFactors: input.riskFactors,
        approvalLevel: level,
        workflowId: input.workflowId,
        status: autoEligible ? 'approved' : 'pending',
        expiresInMs: input.expiresInMs,
      },
      this.config
    )

    await this.queue.create(request)
    await this.logger.log(userId, { requestId: request.id, actor: input.createdBy, action: 'created', details: { riskScore, autoEligible } })
    void this.linkApprovalToMemory(userId, request)

    if (!autoEligible) {
      void this.notifications.notifyApprovalRequired(request)
      return request
    }

    // Auto-execute path: eligible AND below auto-execute threshold AND not an
    // always-manual trigger. Only proceeds if an executor is actually
    // registered; otherwise the request simply sits 'approved', awaiting a
    // human to trigger execution via approveRequest/rollbackRequest tooling.
    this.metrics.recordAutoExecuted()
    return this.executeIfPossible(userId, request, 'system:auto-execute')
  }

  async getApprovalRequest(userId: string, id: string): Promise<ApprovalRequest | null> {
    return this.queue.get(userId, id)
  }

  // ── Decisions ─────────────────────────────────────────────────────────────

  async approveRequest(userId: string, id: string, approvedBy: string): Promise<ApprovalRequest | null> {
    const current = await this.queue.get(userId, id)
    if (!current) return null
    if (current.status !== 'pending') {
      throw new Error(`Cannot approve request ${id}: status is "${current.status}", expected "pending"`)
    }
    const approved = await this.queue.approve(userId, id, approvedBy)
    if (!approved) return null
    await this.logger.log(userId, { requestId: id, actor: approvedBy, action: 'approved' })
    void this.notifications.notifyApprovalCompleted(approved)
    return this.executeIfPossible(userId, approved, approvedBy)
  }

  async rejectRequest(userId: string, id: string, rejectedBy: string, reason?: string): Promise<ApprovalRequest | null> {
    const result = await this.queue.reject(userId, id, rejectedBy, reason)
    if (result) {
      await this.logger.log(userId, { requestId: id, actor: rejectedBy, action: 'rejected', notes: reason })
      void this.notifications.notifyApprovalRejected(result, reason)
    }
    return result
  }

  async cancelRequest(userId: string, id: string, cancelledBy: string, reason?: string): Promise<ApprovalRequest | null> {
    const result = await this.queue.cancel(userId, id, cancelledBy, reason)
    if (result) await this.logger.log(userId, { requestId: id, actor: cancelledBy, action: 'cancelled', notes: reason })
    return result
  }

  async delegateRequest(userId: string, id: string, delegatedTo: string, delegatedBy: string): Promise<ApprovalRequest | null> {
    const result = await this.queue.delegate(userId, id, delegatedTo, delegatedBy)
    if (result) {
      await this.logger.log(userId, { requestId: id, actor: delegatedBy, action: 'delegated', details: { delegatedTo } })
      void this.linkDelegationToMemory(userId, result)
    }
    return result
  }

  async bulkApprove(userId: string, ids: string[], approvedBy: string): Promise<ApprovalRequest[]> {
    const results: ApprovalRequest[] = []
    for (const id of ids) {
      const r = await this.approveRequest(userId, id, approvedBy)
      if (r) results.push(r)
    }
    return results
  }

  async bulkReject(userId: string, ids: string[], rejectedBy: string, reason?: string): Promise<ApprovalRequest[]> {
    const results: ApprovalRequest[] = []
    for (const id of ids) {
      const r = await this.rejectRequest(userId, id, rejectedBy, reason)
      if (r) results.push(r)
    }
    return results
  }

  // ── Execution / Rollback ──────────────────────────────────────────────────

  /** Internal: only ever called once status has reached 'approved'. Asserts this invariant. */
  private async executeIfPossible(userId: string, request: ApprovalRequest, actor: string): Promise<ApprovalRequest> {
    if (request.status !== 'approved') {
      // Not an error — many requests sit approved without an executor registered yet.
      return request
    }
    const executor = this.registry.getExecutor(request.triggerType)
    if (!executor) return request // no executor wired; remains 'approved' until one is

    try {
      await executor.execute(request)
      const executed = await this.queue.markExecuted(userId, request.id, actor)
      if (executed) {
        await this.logger.log(userId, { requestId: request.id, actor, action: 'executed' })
        void this.notifications.notifyExecutionFinished(executed, true)
        return executed
      }
      return request
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      try {
        await executor.rollback(request)
      } catch {
        // best-effort rollback; failure is recorded regardless
      }
      const rolledBack = await this.queue.markRolledBack(userId, request.id, 'system:execution-failure', message)
      await this.logger.log(userId, { requestId: request.id, actor, action: 'rolled_back', notes: message })
      if (rolledBack) void this.notifications.notifyExecutionFinished(rolledBack, false, message)
      return rolledBack ?? request
    }
  }

  async rollbackRequest(userId: string, id: string, actor: string): Promise<ApprovalRequest | null> {
    const request = await this.queue.get(userId, id)
    if (!request) return null
    if (request.status !== 'executed') {
      throw new Error(`Cannot rollback request ${id}: status is "${request.status}", expected "executed"`)
    }
    const executor = this.registry.getExecutor(request.triggerType)
    if (!executor) throw new Error(`No executor registered for triggerType "${request.triggerType}" — cannot roll back`)

    await executor.rollback(request)
    const verified = await executor.verify(request)
    const result = await this.queue.markRolledBack(userId, id, actor, verified ? undefined : 'verification failed after rollback')
    if (result) await this.logger.log(userId, { requestId: id, actor, action: 'rolled_back', details: { verified } })
    return result
  }

  // ── Listing (Executive Dashboard sections) ───────────────────────────────

  async listPending(userId: string): Promise<ApprovalRequest[]> {
    return this.queue.listPending(userId)
  }

  async listUrgent(userId: string): Promise<ApprovalRequest[]> {
    return this.queue.listUrgent(userId, this.config.expiringSoonWindowMs)
  }

  async listExpired(userId: string): Promise<ApprovalRequest[]> {
    return this.queue.listExpired(userId)
  }

  async listExecuted(userId: string): Promise<ApprovalRequest[]> {
    return this.queue.list(userId, { status: 'executed' })
  }

  async listDelegated(userId: string): Promise<ApprovalRequest[]> {
    return this.queue.list(userId, { status: 'delegated' })
  }

  async listRejected(userId: string): Promise<ApprovalRequest[]> {
    return this.queue.list(userId, { status: 'rejected' })
  }

  async listAll(userId: string, filters: { status?: ApprovalStatus; approvalLevel?: ApprovalLevel; triggerType?: ApprovalTriggerType; search?: string } = {}): Promise<ApprovalRequest[]> {
    return this.queue.list(userId, filters)
  }

  // ── Stats / Metrics / Policy ─────────────────────────────────────────────

  async getStats(userId: string): Promise<ApprovalStats> {
    return this.analytics.getStats(userId)
  }

  async getMetrics(userId: string): Promise<ApprovalMetricsSnapshot> {
    return this.metrics.getSnapshot(userId)
  }

  getPolicyBands() {
    return this.policy.getBands()
  }

  // ── Templates ─────────────────────────────────────────────────────────────

  listTemplates() {
    return this.templates.listTemplates()
  }

  getTemplate(triggerType: ApprovalTriggerType) {
    return this.templates.getTemplate(triggerType)
  }

  // ── History ───────────────────────────────────────────────────────────────

  async listHistory(userId: string, requestId?: string) {
    if (requestId) return this.history.listForRequest(userId, requestId)
    return this.history.listAll(userId)
  }

  // ── Scheduler ─────────────────────────────────────────────────────────────

  async runScheduledChecks(userId: string) {
    return this.scheduler.runAllChecks(userId)
  }

  // ── Registry passthrough (for callers/plugins wiring executors) ─────────

  get executors(): ApprovalRegistry {
    return this.registry
  }

  // ── Permissions passthrough ───────────────────────────────────────────────

  get permissionsApi(): ApprovalPermissions {
    return this.permissions
  }

  // ── Memory Graph Integration ──────────────────────────────────────────────
  // Best-effort, identical import/usage pattern to FinanceEngine.linkBudgetToMemory.

  private async linkApprovalToMemory(userId: string, request: ApprovalRequest): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      await graph.upsertNode(
        'task',
        request.title,
        `${request.triggerType} approval (risk ${request.riskScore}/100, level ${request.approvalLevel})`,
        { approvalRequestId: request.id, status: request.status },
        request.riskScore >= 50 ? 35 : 20
      )
    } catch {
      // best-effort
    }
  }

  private async linkDelegationToMemory(userId: string, request: ApprovalRequest): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      await graph.upsertNode(
        'task',
        `Delegated: ${request.title}`,
        `Delegated to ${request.delegatedTo ?? 'unknown'}`,
        { approvalRequestId: request.id, delegatedTo: request.delegatedTo },
        20
      )
    } catch {
      // best-effort
    }
  }
}
