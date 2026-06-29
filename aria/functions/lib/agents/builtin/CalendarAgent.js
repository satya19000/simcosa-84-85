"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const ActionEngine_1 = require("../../action-engine/ActionEngine");
class CalendarAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'calendar-agent',
            name: 'Calendar Agent',
            description: 'Reads and manages calendar events and schedules',
            version: '1.0.0',
            capabilities: ['calendar'],
        };
    }
    canHandle(task) {
        return task.capability === 'calendar';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        const { action, ...args } = task.input;
        try {
            // Calendar data is stored as reminders with type 'event'
            const result = await ActionEngine_1.ActionEngine.run({
                toolName: action ?? 'listReminders',
                args: { ...args, type: 'event' },
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
exports.CalendarAgent = CalendarAgent;
//# sourceMappingURL=CalendarAgent.js.map