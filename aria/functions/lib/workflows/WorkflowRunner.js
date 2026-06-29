"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRunner = void 0;
exports.registerCustomStepHandler = registerCustomStepHandler;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const WorkflowLogger_1 = require("./WorkflowLogger");
const WorkflowMetrics_1 = require("./WorkflowMetrics");
const WorkflowHistory_1 = require("./WorkflowHistory");
const WorkflowTypes_1 = require("./WorkflowTypes");
const WorkflowContext_1 = require("./WorkflowContext");
const action_engine_1 = require("../action-engine");
const plugins_1 = require("../plugins");
const uuid_1 = require("uuid");
// Custom step handlers registered by plugins.
const customHandlers = new Map();
function registerCustomStepHandler(name, handler) {
    customHandlers.set(name, handler);
}
function mergeRetry(stepPolicy, defaultPolicy) {
    return {
        maxAttempts: stepPolicy?.maxAttempts ?? defaultPolicy?.maxAttempts ?? WorkflowTypes_1.DEFAULT_RETRY_POLICY.maxAttempts,
        delayMs: stepPolicy?.delayMs ?? defaultPolicy?.delayMs ?? WorkflowTypes_1.DEFAULT_RETRY_POLICY.delayMs,
        backoffMultiplier: stepPolicy?.backoffMultiplier ?? defaultPolicy?.backoffMultiplier ?? WorkflowTypes_1.DEFAULT_RETRY_POLICY.backoffMultiplier,
        timeoutMs: stepPolicy?.timeoutMs ?? defaultPolicy?.timeoutMs ?? WorkflowTypes_1.DEFAULT_RETRY_POLICY.timeoutMs,
    };
}
function resolveArgs(args, vars) {
    return Object.fromEntries(Object.entries(args).map(([k, v]) => [
        k,
        typeof v === 'string' ? (0, WorkflowContext_1.interpolate)(v, vars) : v,
    ]));
}
function evaluateConditionExpr(expr, vars) {
    const val = vars[expr.field];
    switch (expr.operator) {
        case 'exists': return val !== undefined && val !== null;
        case 'not_exists': return val === undefined || val === null;
        case 'eq': return val === expr.value;
        case 'neq': return val !== expr.value;
        case 'gt': return typeof val === 'number' && val > expr.value;
        case 'lt': return typeof val === 'number' && val < expr.value;
        case 'gte': return typeof val === 'number' && val >= expr.value;
        case 'lte': return typeof val === 'number' && val <= expr.value;
        case 'contains':
            if (typeof val === 'string')
                return val.includes(String(expr.value));
            if (Array.isArray(val))
                return val.includes(expr.value);
            return false;
        default: return false;
    }
}
function evaluateCondition(condition, vars) {
    if ('and' in condition)
        return condition.and.every((e) => evaluateConditionExpr(e, vars));
    if ('or' in condition)
        return condition.or.some((e) => evaluateConditionExpr(e, vars));
    return evaluateConditionExpr(condition, vars);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
class WorkflowRunner {
    constructor(db, apiKey) {
        this.db = db;
        this.anthropic = null;
        this.history = new WorkflowHistory_1.WorkflowHistory(db);
        if (apiKey)
            this.anthropic = new sdk_1.default({ apiKey });
    }
    async run(definition, userId, triggerData, userDisplayName) {
        const executionId = (0, uuid_1.v4)();
        const startedAt = new Date().toISOString();
        const startMs = Date.now();
        const ctx = {
            userId,
            userDisplayName,
            db: this.db,
            workflowId: definition.id,
            executionId,
            vars: { ...(triggerData ?? {}) },
            triggerData,
            startedAt,
            cancelRequested: false,
        };
        const logger = new WorkflowLogger_1.WorkflowLogger(executionId, definition.id);
        const metrics = new WorkflowMetrics_1.WorkflowMetrics(executionId, definition.id, startMs);
        const stepResults = [];
        logger.info(`Starting workflow "${definition.name}"`);
        // Global timeout guard
        const timeoutMs = definition.timeoutMs ?? 300000;
        const timeoutAt = Date.now() + timeoutMs;
        try {
            for (let i = 0; i < definition.steps.length; i++) {
                if (ctx.cancelRequested) {
                    logger.warn('Workflow cancelled by request');
                    break;
                }
                if (Date.now() > timeoutAt) {
                    throw new Error(`Workflow timed out after ${timeoutMs}ms`);
                }
                const step = definition.steps[i];
                const result = await this.executeStep(step, ctx, logger, metrics, definition);
                stepResults.push(result);
                if (step.outputKey && result.output !== undefined) {
                    ctx.vars[step.outputKey] = result.output;
                }
                if (result.status === 'failed' && !step.continueOnError) {
                    const workflowResult = {
                        workflowId: definition.id,
                        executionId,
                        status: 'failed',
                        startedAt,
                        completedAt: new Date().toISOString(),
                        durationMs: Date.now() - startMs,
                        stepResults,
                        outputVars: ctx.vars,
                        error: result.error ?? 'Step failed',
                    };
                    await this.history.save(userId, workflowResult);
                    return workflowResult;
                }
            }
            const status = ctx.cancelRequested ? 'cancelled' : 'completed';
            const workflowResult = {
                workflowId: definition.id,
                executionId,
                status,
                startedAt,
                completedAt: new Date().toISOString(),
                durationMs: Date.now() - startMs,
                stepResults,
                outputVars: ctx.vars,
            };
            logger.info(`Workflow ${status} in ${workflowResult.durationMs}ms`);
            await this.history.save(userId, workflowResult);
            return workflowResult;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.error(`Workflow fatal error: ${msg}`);
            const workflowResult = {
                workflowId: definition.id,
                executionId,
                status: 'failed',
                startedAt,
                completedAt: new Date().toISOString(),
                durationMs: Date.now() - startMs,
                stepResults,
                outputVars: ctx.vars,
                error: msg,
            };
            await this.history.save(userId, workflowResult);
            return workflowResult;
        }
    }
    async executeStep(step, ctx, logger, metrics, definition) {
        // Evaluate step-level condition guard
        if (step.condition && !evaluateCondition(step.condition, ctx.vars)) {
            logger.info(`Step "${step.name}" skipped (condition false)`, step.id);
            metrics.recordStepSkipped();
            return this.makeResult(step, 'skipped', 0, 1);
        }
        const policy = mergeRetry(step.retryPolicy, definition.defaultRetryPolicy);
        let attempt = 0;
        let lastError;
        while (attempt < policy.maxAttempts) {
            attempt++;
            metrics.recordStepStarted();
            const t0 = Date.now();
            try {
                const output = await Promise.race([
                    this.dispatchStep(step, ctx, logger, metrics),
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`Step timed out after ${policy.timeoutMs}ms`)), policy.timeoutMs)),
                ]);
                logger.info(`Step "${step.name}" completed (attempt ${attempt})`, step.id);
                metrics.recordStepSuccess();
                return this.makeResult(step, 'completed', Date.now() - t0, attempt, output);
            }
            catch (err) {
                lastError = err instanceof Error ? err.message : String(err);
                logger.warn(`Step "${step.name}" attempt ${attempt} failed: ${lastError}`, step.id);
                metrics.recordStepFailure();
                if (attempt < policy.maxAttempts) {
                    metrics.recordRetry();
                    const delay = policy.delayMs * Math.pow(policy.backoffMultiplier, attempt - 1);
                    logger.info(`Retrying in ${delay}ms…`, step.id);
                    await sleep(delay);
                }
            }
        }
        logger.error(`Step "${step.name}" failed after ${attempt} attempts`, step.id);
        return this.makeResult(step, 'failed', 0, attempt, undefined, lastError);
    }
    async dispatchStep(step, ctx, logger, metrics) {
        switch (step.type) {
            case 'run_action': {
                const args = resolveArgs(step.args, ctx.vars);
                metrics.recordActionCall();
                const result = await action_engine_1.ActionEngine.run({
                    toolName: step.toolName,
                    args,
                    userId: ctx.userId,
                    userDisplayName: ctx.userDisplayName,
                    db: ctx.db,
                });
                if (!result.success)
                    throw new Error(result.message);
                return result.data;
            }
            case 'run_plugin': {
                const args = resolveArgs(step.args, ctx.vars);
                metrics.recordPluginCall();
                const result = await (0, plugins_1.executePluginTool)(step.toolName, args, ctx.userId, ctx.db);
                if (!result.success)
                    throw new Error(result.error ?? result.message);
                return result.data;
            }
            case 'run_ai': {
                if (!this.anthropic)
                    throw new Error('AI not configured for workflow runner');
                metrics.recordAICall();
                const prompt = (0, WorkflowContext_1.interpolate)(step.prompt, ctx.vars);
                const response = await this.anthropic.messages.create({
                    model: 'claude-opus-4-8',
                    max_tokens: step.maxTokens ?? 512,
                    messages: [{ role: 'user', content: prompt }],
                });
                const text = response.content
                    .filter((b) => b.type === 'text')
                    .map((b) => b.text)
                    .join('');
                return text;
            }
            case 'condition': {
                const branch = evaluateCondition(step.condition, ctx.vars) ? step.thenSteps : (step.elseSteps ?? []);
                for (const s of branch) {
                    const r = await this.executeStep(s, ctx, logger, metrics, { defaultRetryPolicy: undefined });
                    if (s.outputKey && r.output !== undefined)
                        ctx.vars[s.outputKey] = r.output;
                }
                return undefined;
            }
            case 'delay': {
                logger.info(`Waiting ${step.durationMs}ms`, step.id);
                await sleep(step.durationMs);
                return undefined;
            }
            case 'parallel': {
                const results = await Promise.allSettled(step.steps.map((s) => this.executeStep(s, ctx, logger, metrics, { defaultRetryPolicy: undefined })));
                const failed = results.filter((r) => r.status === 'rejected');
                if (failed.length > 0)
                    throw new Error(`${failed.length} parallel steps failed`);
                return results
                    .filter((r) => r.status === 'fulfilled')
                    .map((r) => r.value.output);
            }
            case 'loop': {
                let iter = 0;
                while (iter < step.maxIterations) {
                    if (step.condition && !evaluateCondition(step.condition, ctx.vars))
                        break;
                    for (const s of step.steps) {
                        await this.executeStep(s, ctx, logger, metrics, { defaultRetryPolicy: undefined });
                    }
                    iter++;
                }
                return iter;
            }
            case 'notification': {
                metrics.recordNotification();
                // Firestore signal — client listens on this document
                const title = (0, WorkflowContext_1.interpolate)(step.title, ctx.vars);
                const body = (0, WorkflowContext_1.interpolate)(step.body, ctx.vars);
                await ctx.db.collection('users').doc(ctx.userId).collection('workflowNotifications').add({
                    executionId: ctx.executionId,
                    workflowId: ctx.workflowId,
                    title,
                    body,
                    data: step.data ?? {},
                    createdAt: new Date().toISOString(),
                    read: false,
                });
                return { title, body };
            }
            case 'generate_briefing': {
                const timezone = step.timezone ?? 'UTC';
                const now = new Date();
                const [tasksSnap, remindersSnap] = await Promise.all([
                    ctx.db.collection('users').doc(ctx.userId).collection('tasks')
                        .where('completed', '==', false).limit(30).get(),
                    ctx.db.collection('users').doc(ctx.userId).collection('reminders')
                        .where('completed', '==', false).orderBy('scheduledAt', 'asc').limit(10).get(),
                ]);
                const taskTitles = tasksSnap.docs.map((d) => String(d.data()['title'] ?? '')).join(', ');
                const reminderTitles = remindersSnap.docs.map((d) => String(d.data()['title'] ?? '')).join(', ');
                return {
                    timezone,
                    generatedAt: now.toISOString(),
                    taskSummary: taskTitles || 'No pending tasks',
                    reminderSummary: reminderTitles || 'No upcoming reminders',
                };
            }
            case 'speak_text': {
                const text = (0, WorkflowContext_1.interpolate)(step.text, ctx.vars);
                // Store as a signal for the client to read and speak
                await ctx.db.collection('users').doc(ctx.userId).collection('workflowSpeech').add({
                    executionId: ctx.executionId,
                    text,
                    createdAt: new Date().toISOString(),
                    spoken: false,
                });
                return { text };
            }
            case 'custom': {
                const handler = customHandlers.get(step.handler);
                if (!handler)
                    throw new Error(`Custom step handler "${step.handler}" not registered`);
                return handler(step.args ?? {}, ctx);
            }
            default: {
                const exhaustive = step;
                throw new Error(`Unknown step type: ${exhaustive.type}`);
            }
        }
    }
    makeResult(step, status, durationMs, attempts, output, error) {
        const now = new Date().toISOString();
        return {
            stepId: step.id,
            stepName: step.name,
            status,
            startedAt: new Date(Date.now() - durationMs).toISOString(),
            completedAt: now,
            durationMs,
            attempts,
            output,
            error,
        };
    }
}
exports.WorkflowRunner = WorkflowRunner;
//# sourceMappingURL=WorkflowRunner.js.map