"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const ActionEngine_1 = require("../../action-engine/ActionEngine");
class TaskAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'task-agent',
            name: 'Task Agent',
            description: 'Creates, updates, and reads tasks via ActionEngine',
            version: '1.0.0',
            capabilities: ['tasks'],
        };
    }
    canHandle(task) {
        return task.capability === 'tasks';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        const { action, ...args } = task.input;
        try {
            const toolName = action ?? 'listTasks';
            const result = await ActionEngine_1.ActionEngine.run({
                toolName,
                args: args,
                userId: ctx.userId,
                userDisplayName: ctx.userDisplayName,
                db: ctx.db,
            });
            if (!result.success) {
                return this.makeErrorResult(task, ctx, result.error?.detail ?? 'Action failed', startMs);
            }
            return this.makeResult(task, ctx, result.data, result.message, startMs);
        }
        catch (err) {
            return this.makeErrorResult(task, ctx, err, startMs);
        }
    }
}
exports.TaskAgent = TaskAgent;
//# sourceMappingURL=TaskAgent.js.map