import type { Agent, AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import type { AgentConfig } from '../AgentConfig'
import type { AgentStatus, ValidationResult } from '../AgentTypes'
import type { AgentHealthSnapshot } from '../AgentHealth'
import { AgentLogger } from '../AgentLogger'
import { AgentMetrics } from '../AgentMetrics'
import { AgentMemory } from '../AgentMemory'

/**
 * Shared base for all built-in agents.
 * Provides default implementations of plan, validate, rollback, shutdown, healthCheck.
 * Subclasses must implement: manifest (readonly), canHandle(), execute().
 */
export abstract class BaseAgent implements Agent {
  abstract readonly manifest: AgentManifest
  abstract canHandle(task: AgentTask): boolean
  abstract execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult>
  readonly config: AgentConfig = {} as AgentConfig
  status: AgentStatus = 'unregistered'

  protected readonly logger: AgentLogger
  protected readonly metrics: AgentMetrics
  protected readonly memory: AgentMemory

  constructor() {
    // Delay logger/metrics construction until manifest is available (set by subclass)
    // Using a late-init trick via getter-like approach via Proxy would be over-engineering;
    // instead we pass 'base' and subclass overrides with its own id after super().
    this.logger = new AgentLogger('base-agent')
    this.metrics = new AgentMetrics('base-agent')
    this.memory = new AgentMemory('base-agent')
  }

  async initialize(config: AgentConfig): Promise<void> {
    Object.assign(this.config, config)
    this.status = 'idle'
  }

  /** Default: pass-through. Subclasses can override to add planning logic. */
  async plan(_task: AgentTask, _ctx: AgentContext): Promise<Record<string, unknown>> {
    return {}
  }

  /** Default: pass if status is completed and output is not null. */
  async validate(result: AgentResult, _ctx: AgentContext): Promise<ValidationResult> {
    if (result.status === 'completed' && result.output !== null) {
      return { outcome: 'pass', issues: [], confidence: 1 }
    }
    return { outcome: 'fail', issues: [result.error ?? 'No output produced'], confidence: 0.9 }
  }

  /** Default: no-op rollback. */
  async rollback(_task: AgentTask, _ctx: AgentContext): Promise<void> {}

  async shutdown(): Promise<void> {
    this.status = 'shutdown'
  }

  async healthCheck(): Promise<AgentHealthSnapshot> {
    const start = Date.now()
    return {
      agentId: this.manifest.id,
      status: this.status,
      healthy: this.status !== 'error' && this.status !== 'shutdown' && this.status !== 'disabled',
      lastCheckedAt: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
    }
  }

  protected makeResult(
    task: AgentTask,
    ctx: AgentContext,
    output: unknown,
    summary: string,
    startMs: number,
    tokenUsage?: { input: number; output: number }
  ): AgentResult {
    return {
      taskId: task.taskId,
      graphRunId: ctx.graphRunId,
      agentId: ctx.agentId,
      status: 'completed',
      output,
      summary,
      tokenUsage,
      durationMs: Date.now() - startMs,
      attempts: task.attempts + 1,
      completedAt: new Date().toISOString(),
    }
  }

  protected makeErrorResult(
    task: AgentTask,
    ctx: AgentContext,
    error: unknown,
    startMs: number
  ): AgentResult {
    return {
      taskId: task.taskId,
      graphRunId: ctx.graphRunId,
      agentId: ctx.agentId,
      status: 'failed',
      output: null,
      summary: `Failed: ${String(error)}`,
      durationMs: Date.now() - startMs,
      attempts: task.attempts + 1,
      error: String(error),
      completedAt: new Date().toISOString(),
    }
  }
}
