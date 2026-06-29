export interface WorkflowExecutionMetrics {
  executionId: string
  workflowId: string
  totalDurationMs: number
  stepCount: number
  successfulSteps: number
  failedSteps: number
  skippedSteps: number
  retryCount: number
  aiCallCount: number
  pluginCallCount: number
  actionCallCount: number
  notificationCount: number
  cacheHits: number
  peakMemoryEstimateBytes: number
  completedAt: string
}

/** Collects metrics during a single workflow execution. */
export class WorkflowMetrics {
  private stepCount = 0
  private successfulSteps = 0
  private failedSteps = 0
  private skippedSteps = 0
  private retryCount = 0
  private aiCallCount = 0
  private pluginCallCount = 0
  private actionCallCount = 0
  private notificationCount = 0
  private cacheHits = 0

  constructor(
    private readonly executionId: string,
    private readonly workflowId: string,
    private readonly startedAt: number
  ) {}

  recordStepStarted(): void { this.stepCount++ }
  recordStepSuccess(): void { this.successfulSteps++ }
  recordStepFailure(): void { this.failedSteps++ }
  recordStepSkipped(): void { this.skippedSteps++ }
  recordRetry(): void { this.retryCount++ }
  recordAICall(): void { this.aiCallCount++ }
  recordPluginCall(): void { this.pluginCallCount++ }
  recordActionCall(): void { this.actionCallCount++ }
  recordNotification(): void { this.notificationCount++ }
  recordCacheHit(): void { this.cacheHits++ }

  snapshot(): WorkflowExecutionMetrics {
    return {
      executionId: this.executionId,
      workflowId: this.workflowId,
      totalDurationMs: Date.now() - this.startedAt,
      stepCount: this.stepCount,
      successfulSteps: this.successfulSteps,
      failedSteps: this.failedSteps,
      skippedSteps: this.skippedSteps,
      retryCount: this.retryCount,
      aiCallCount: this.aiCallCount,
      pluginCallCount: this.pluginCallCount,
      actionCallCount: this.actionCallCount,
      notificationCount: this.notificationCount,
      cacheHits: this.cacheHits,
      peakMemoryEstimateBytes: process.memoryUsage().heapUsed,
      completedAt: new Date().toISOString(),
    }
  }
}
