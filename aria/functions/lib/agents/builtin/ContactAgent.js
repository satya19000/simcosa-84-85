"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const ActionEngine_1 = require("../../action-engine/ActionEngine");
class ContactAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'contact-agent',
            name: 'Contact Agent',
            description: 'Searches and manages contacts via ActionEngine',
            version: '1.0.0',
            capabilities: ['contacts'],
        };
    }
    canHandle(task) {
        return task.capability === 'contacts';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        const { action, ...args } = task.input;
        try {
            const result = await ActionEngine_1.ActionEngine.run({
                toolName: action ?? 'searchContacts',
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
exports.ContactAgent = ContactAgent;
//# sourceMappingURL=ContactAgent.js.map