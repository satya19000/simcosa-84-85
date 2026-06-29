import type { AgentTask } from './AgentTask'
import type { AgentResult, GraphRunResult } from './AgentResult'
import type { AgentContext } from './AgentContext'
import { AgentRegistry } from './AgentRegistry'
import { AgentHealthMonitor } from './AgentHealth'
import { TaskRouter } from './TaskRouter'
import { DependencyResolver } from './DependencyResolver'
import { ExecutionGraph } from './ExecutionGraph'
import { AgentLogger } from './AgentLogger'
import { agentEventBus } from './AgentEvents'
import { resolveAgentConfig } from './AgentConfig'
import type { AgentConfig } from './AgentConfig'

export interface OrchestratorRunOptions {
  graphRunId: string
  userId: string
  userDisplayName?: string
  tasks: AgentTask[]
  baseContext: Omit<AgentContext, 'taskId' | 'agentId' | 'graphRunId'>
}

/**
 * Orchestrates a DAG of agent tasks.
 * Does NOT interpret intent — that is the PlannerAgent's job.
 * Receives a pre-built task list and drives execution to completion.
 */
export class Orchestrator {
  private readonly logger = new AgentLogger('orchestrator')
  private readonly router: TaskRouter
  private readonly resolver = new DependencyResolver()

  constructor(
    private readonly registry: AgentRegistry,
    health: AgentHealthMonitor,
    _config?: Partial<AgentConfig>
  ) {
    resolveAgentConfig(_config) // validates config but Orchestrator doesn't use it directly
    this.router = new TaskRouter(registry, health)
  }

  async run(opts: OrchestratorRunOptions): Promise<GraphRunResult> {
    const { graphRunId, userId, tasks, baseContext } = opts
    const startedAt = new Date().toISOString()

    this.logger.info(`Graph run ${graphRunId} started — ${tasks.length} task(s)`)
    await agentEventBus.emit('agent:graph:started', 'orchestrator', { graphRunId, taskCount: tasks.length })

    let graph: ExecutionGraph
    try {
      graph = this.resolver.resolve(graphRunId, tasks)
    } catch (err) {
      return this.failResult(graphRunId, userId, startedAt, `Dependency resolution failed: ${String(err)}`)
    }

    const sharedVars: Record<string, unknown> = { ...baseContext.sharedVars }
    const taskResults: AgentResult[] = []

    while (!graph.isComplete()) {
      const ready = graph.getReady()
      if (ready.length === 0) {
        // No progress possible — either stuck or all done
        break
      }

      // Route all ready tasks
      const dispatches: Promise<void>[] = []
      for (const task of ready) {
        graph.setStatus(task.taskId, 'queued')
        const decision = this.router.route(task)
        if (!decision) {
          this.logger.warn(`No agent available for task "${task.taskId}" (${task.capability})`)
          graph.setStatus(task.taskId, 'failed')
          continue
        }

        const agent = this.registry.get(decision.agentId)
        if (!agent) {
          graph.setStatus(task.taskId, 'failed')
          continue
        }

        const ctx: AgentContext = {
          ...baseContext,
          graphRunId,
          taskId: task.taskId,
          agentId: decision.agentId,
          sharedVars,
        }

        dispatches.push(this.executeTask(task, agent, ctx, graph, sharedVars, taskResults))
      }

      await Promise.all(dispatches)
    }

    const failed = graph.hasFailed()
    const allNodes = graph.allNodes()
    const status = failed ? 'partial' : 'completed'

    const assembledResponse = this.assembleResponse(taskResults, sharedVars)

    const completedAt = new Date().toISOString()
    const totalDurationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime()

    await agentEventBus.emit(failed ? 'agent:graph:failed' : 'agent:graph:completed', 'orchestrator', {
      graphRunId,
      status,
      taskCount: allNodes.length,
    })

    this.logger.info(`Graph run ${graphRunId} ${status} in ${totalDurationMs}ms`)

    return {
      graphRunId,
      userId,
      status,
      assembledResponse,
      taskResults,
      sharedVars,
      totalDurationMs,
      startedAt,
      completedAt,
    }
  }

  private async executeTask(
    task: AgentTask,
    agent: { status: string; manifest: { id: string }; canHandle: (t: AgentTask) => boolean; plan: (t: AgentTask, ctx: AgentContext) => Promise<Record<string, unknown>>; execute: (t: AgentTask, ctx: AgentContext) => Promise<AgentResult>; validate: (r: AgentResult, ctx: AgentContext) => Promise<import('./AgentTypes').ValidationResult> },
    ctx: AgentContext,
    graph: ExecutionGraph,
    sharedVars: Record<string, unknown>,
    taskResults: AgentResult[]
  ): Promise<void> {
    graph.markStarted(task.taskId)
    graph.setStatus(task.taskId, 'running')
    await agentEventBus.emit('agent:task:started', agent.manifest.id, { taskId: task.taskId })

    try {
      // Inject shared vars from dependencies into task input
      const enrichedInput = this.enrichInput(task, graph, sharedVars)
      const enrichedTask = { ...task, input: enrichedInput }

      // Plan phase (optional decomposition)
      const plannedInput = await agent.plan(enrichedTask, ctx)
      const plannedTask = { ...enrichedTask, input: { ...enrichedTask.input, ...plannedInput } }

      // Execute
      const result = await agent.execute(plannedTask, ctx)

      // Validate
      graph.setStatus(task.taskId, 'validating')
      const validation = await agent.validate(result, ctx)
      const finalResult: AgentResult = { ...result, validationResult: validation }

      if (validation.outcome === 'pass') {
        graph.setStatus(task.taskId, 'completed')
        graph.setResult(task.taskId, finalResult)
        taskResults.push(finalResult)

        // Propagate output to sharedVars if task declares an outputKey
        if (task.outputKey) {
          sharedVars[task.outputKey] = finalResult.output
        }

        await agentEventBus.emit('agent:task:completed', agent.manifest.id, { taskId: task.taskId })
      } else {
        graph.setStatus(task.taskId, 'failed')
        graph.setResult(task.taskId, finalResult)
        taskResults.push(finalResult)
        await agentEventBus.emit('agent:task:failed', agent.manifest.id, { taskId: task.taskId, validation })
      }
    } catch (err) {
      const errorResult: AgentResult = {
        taskId: task.taskId,
        graphRunId: ctx.graphRunId,
        agentId: agent.manifest.id,
        status: 'failed',
        output: null,
        summary: `Unhandled error: ${String(err)}`,
        durationMs: 0,
        attempts: task.attempts + 1,
        error: String(err),
        completedAt: new Date().toISOString(),
      }
      graph.setStatus(task.taskId, 'failed')
      graph.setResult(task.taskId, errorResult)
      taskResults.push(errorResult)
      await agentEventBus.emit('agent:task:failed', agent.manifest.id, { taskId: task.taskId, error: String(err) })
    }
  }

  private enrichInput(
    task: AgentTask,
    graph: ExecutionGraph,
    sharedVars: Record<string, unknown>
  ): Record<string, unknown> {
    const extra: Record<string, unknown> = {}
    for (const depId of task.dependsOn) {
      const node = graph.getNode(depId)
      if (node?.result) {
        extra[`dep_${depId}`] = node.result.output
      }
    }
    return { ...task.input, ...extra, sharedVars }
  }

  private assembleResponse(results: AgentResult[], sharedVars: Record<string, unknown>): string {
    // Use a summary string from sharedVars if a PlannerAgent put one there
    if (typeof sharedVars['assembledResponse'] === 'string') {
      return sharedVars['assembledResponse']
    }

    const summaries = results
      .filter((r) => r.status === 'completed' && r.summary)
      .map((r) => r.summary)

    return summaries.length > 0 ? summaries.join('\n') : 'Task completed.'
  }

  private failResult(
    graphRunId: string,
    userId: string,
    startedAt: string,
    error: string
  ): GraphRunResult {
    const completedAt = new Date().toISOString()
    return {
      graphRunId,
      userId,
      status: 'failed',
      assembledResponse: error,
      taskResults: [],
      sharedVars: {},
      totalDurationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      startedAt,
      completedAt,
      error,
    }
  }
}
