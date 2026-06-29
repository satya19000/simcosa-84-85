"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const ActionEngine_1 = require("../../action-engine/ActionEngine");
class NotificationAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'notification-agent',
            name: 'Notification Agent',
            description: 'Sends push notifications and in-app alerts',
            version: '1.0.0',
            capabilities: ['notification'],
        };
    }
    canHandle(task) {
        return task.capability === 'notification';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        const { title, body, data } = task.input;
        try {
            const result = await ActionEngine_1.ActionEngine.run({
                toolName: 'sendNotification',
                args: { title: title ?? 'ARIA', body: body ?? '', data },
                userId: ctx.userId,
                userDisplayName: ctx.userDisplayName,
                db: ctx.db,
            });
            if (!result.success) {
                return this.makeErrorResult(task, ctx, result.error?.detail ?? 'Notification failed', startMs);
            }
            return this.makeResult(task, ctx, result.data, result.message, startMs);
        }
        catch (err) {
            return this.makeErrorResult(task, ctx, err, startMs);
        }
    }
}
exports.NotificationAgent = NotificationAgent;
//# sourceMappingURL=NotificationAgent.js.map