import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { AIUsageRecord, AIProviderId, ModelTaskType } from './ModelTypes'

const USAGE_COL = (tenantId: string) => `tenants/${tenantId}/aiUsage`

export interface RecordUsageInput {
  tenantId: string
  userId: string
  requestId: string
  provider: AIProviderId
  model: string
  taskType: ModelTaskType
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  latencyMs: number
  success: boolean
  fallbackUsed: boolean
}

/**
 * Repository for tenants/{tenantId}/aiUsage/{usageId}. Every AIGateway
 * request — success or failure — writes exactly one usage record here, so
 * getAIUsage / monthly-spend policy checks always have a complete picture.
 */
export class ModelUsageTracker {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async record(input: RecordUsageInput): Promise<AIUsageRecord> {
    const usageId = uuidv4()
    const record: AIUsageRecord = {
      id: usageId,
      usageId,
      tenantId: input.tenantId,
      userId: input.userId,
      requestId: input.requestId,
      provider: input.provider,
      model: input.model,
      taskType: input.taskType,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      estimatedCostUsd: input.estimatedCostUsd,
      latencyMs: input.latencyMs,
      success: input.success,
      fallbackUsed: input.fallbackUsed,
      timestamp: new Date().toISOString(),
    }
    await this.db.collection(USAGE_COL(input.tenantId)).doc(usageId).set(record)
    return record
  }

  async listRecent(tenantId: string, limit = 100): Promise<AIUsageRecord[]> {
    const snap = await this.db
      .collection(USAGE_COL(tenantId))
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as AIUsageRecord)
  }

  /** Sum of estimatedCostUsd for usage records timestamped within the current calendar month. */
  async getMonthToDateSpend(tenantId: string): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setUTCDate(1)
    startOfMonth.setUTCHours(0, 0, 0, 0)

    const snap = await this.db
      .collection(USAGE_COL(tenantId))
      .where('timestamp', '>=', startOfMonth.toISOString())
      .get()

    return snap.docs.reduce((sum, d) => sum + ((d.data() as AIUsageRecord).estimatedCostUsd ?? 0), 0)
  }
}
