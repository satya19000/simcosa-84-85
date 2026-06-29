"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
const TaskRouter_1 = require("./TaskRouter");
const DependencyResolver_1 = require("./DependencyResolver");
const AgentLogger_1 = require("./AgentLogger");
const AgentEvents_1 = require("./AgentEvents");
const AgentConfig_1 = require("./AgentConfig");
/**
 * Orchestrates a DAG of agent tasks.
 * Does NOT interpret intent — that is the PlannerAgent's job.
 * Receives a pre-built task list and drives execution to completion.
 */
class Orchestrator {
    constructor(registry, health, _config) {
        this.registry = registry;
        this.logger = new AgentLogger_1.AgentLogger('orchestrator');
        this.resolver = new DependencyResolver_1.DependencyResolver();
        (0, AgentConfig_1.resolveAgentConfig)(_config); // validates config but Orchestrator doesn't use it directly
        this.router = new TaskRouter_1.TaskRouter(registry, health);
    }
    async run(opts) {
        const { graphRunId, userId, tasks, baseContext } = opts;
        const startedAt = new Date().toISOString();
        this.logger.info(`Graph run ${graphRunId} started — ${tasks.length} task(s)`);
        await AgentEvents_1.agentEventBus.emit('agent:graph:started', 'orchestrator', { graphRunId, taskCount: tasks.length });
        let graph;
        try {
            graph = this.resolver.resolve(graphRunId, tasks);
        }
        catch (err) {
            return this.failResult(graphRunId, userId, startedAt, `Dependency resolution failed: ${String(err)}`);
        }
        const sharedVars = { ...baseContext.sharedVars };
        const taskResults = [];
        while (!graph.isComplete()) {
            const ready = graph.getReady();
            if (ready.length === 0) {
                // No progress possible — either stuck or all done
                break;
            }
            // Route all ready tasks
            const dispatches = [];
            for (const task of ready) {
                graph.setStatus(task.taskId, 'queued');
                const decision = this.router.route(task);
                if (!decision) {
                    this.logger.warn(`No agent available for task "${task.taskId}" (${task.capability})`);
                    graph.setStatus(task.taskId, 'failed');
                    continue;
                }
                const agent = this.registry.get(decision.agentId);
                if (!agent) {
                    graph.setStatus(task.taskId, 'failed');
                    continue;
                }
                const ctx = {
                    ...baseContext,
                    graphRunId,
                    taskId: task.taskId,
                    agentId: decision.agentId,
                    sharedVars,
                };
                dispatches.push(this.executeTask(task, agent, ctx, graph, sharedVars, taskResults));
            }
            await Promise.all(dispatches);
        }
        const failed = graph.hasFailed();
        const allNodes = graph.allNodes();
        const status = failed ? 'partial' : 'completed';
        const assembledResponse = this.assembleResponse(taskResults, sharedVars);
        const completedAt = new Date().toISOString();
        const totalDurationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
        await AgentEvents_1.agentEventBus.emit(failed ? 'agent:graph:failed' : 'agent:graph:completed', 'orchestrator', {
            graphRunId,
            status,
            taskCount: allNodes.length,
        });
        this.logger.info(`Graph run ${graphRunId} ${status} in ${totalDurationMs}ms`);
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
        };
    }
    async executeTask(task, agent, ctx, graph, sharedVars, taskResults) {
        graph.markStarted(task.taskId);
        graph.setStatus(task.taskId, 'running');
        await AgentEvents_1.agentEventBus.emit('agent:task:started', agent.manifest.id, { taskId: task.taskId });
        try {
            // Inject shared vars from dependencies into task input
            const enrichedInput = this.enrichInput(task, graph, sharedVars);
            const enrichedTask = { ...task, input: enrichedInput };
            // Plan phase (optional decomposition)
            const plannedInput = await agent.plan(enrichedTask, ctx);
            const plannedTask = { ...enrichedTask, input: { ...enrichedTask.input, ...plannedInput } };
            // Execute
            const result = await agent.execute(plannedTask, ctx);
            // Validate
            graph.setStatus(task.taskId, 'validating');
            const validation = await agent.validate(result, ctx);
            const finalResult = { ...result, validationResult: validation };
            if (validation.outcome === 'pass') {
                graph.setStatus(task.taskId, 'completed');
                graph.setResult(task.taskId, finalResult);
                taskResults.push(finalResult);
                // Propagate output to sharedVars if task declares an outputKey
                if (task.outputKey) {
                    sharedVars[task.outputKey] = finalResult.output;
                }
                await AgentEvents_1.agentEventBus.emit('agent:task:completed', agent.manifest.id, { taskId: task.taskId });
            }
            else {
                graph.setStatus(task.taskId, 'failed');
                graph.setResult(task.taskId, finalResult);
                taskResults.push(finalResult);
                await AgentEvents_1.agentEventBus.emit('agent:task:failed', agent.manifest.id, { taskId: task.taskId, validation });
            }
        }
        catch (err) {
            const errorResult = {
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
            };
            graph.setStatus(task.taskId, 'failed');
            graph.setResult(task.taskId, errorResult);
            taskResults.push(errorResult);
            await AgentEvents_1.agentEventBus.emit('agent:task:failed', agent.manifest.id, { taskId: task.taskId, error: String(err) });
        }
    }
    enrichInput(task, graph, sharedVars) {
        const extra = {};
        for (const depId of task.dependsOn) {
            const node = graph.getNode(depId);
            if (node?.result) {
                extra[`dep_${depId}`] = node.result.output;
            }
        }
        return { ...task.input, ...extra, sharedVars };
    }
    assembleResponse(results, sharedVars) {
        // Use a summary string from sharedVars if a PlannerAgent put one there
        if (typeof sharedVars['assembledResponse'] === 'string') {
            return sharedVars['assembledResponse'];
        }
        const summaries = results
            .filter((r) => r.status === 'completed' && r.summary)
            .map((r) => r.summary);
        return summaries.length > 0 ? summaries.join('\n') : 'Task completed.';
    }
    failResult(graphRunId, userId, startedAt, error) {
        const completedAt = new Date().toISOString();
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
        };
    }
}
exports.Orchestrator = Orchestrator;
//# sourceMappingURL=Orchestrator.js.map