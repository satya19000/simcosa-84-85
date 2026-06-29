"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const workflows_1 = require("../../workflows");
class WorkflowAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'workflow-agent',
            name: 'Workflow Agent',
            description: 'Triggers registered workflows via the Workflow Engine',
            version: '1.0.0',
            capabilities: ['workflow'],
        };
    }
    canHandle(task) {
        return task.capability === 'workflow';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        const workflowId = String(task.input['workflowId'] ?? '');
        const triggerData = task.input['triggerData'];
        if (!workflowId) {
            return this.makeErrorResult(task, ctx, 'workflowId is required', startMs);
        }
        try {
            const result = await (0, workflows_1.runWorkflow)(workflowId, ctx.userId, ctx.db, ctx.apiKey, triggerData, ctx.userDisplayName);
            if (result.status === 'failed') {
                return this.makeErrorResult(task, ctx, result.error ?? 'Workflow failed', startMs);
            }
            return this.makeResult(task, ctx, result, `Workflow "${workflowId}" completed with status: ${result.status}`, startMs);
        }
        catch (err) {
            return this.makeErrorResult(task, ctx, err, startMs);
        }
    }
}
exports.WorkflowAgent = WorkflowAgent;
//# sourceMappingURL=WorkflowAgent.js.map