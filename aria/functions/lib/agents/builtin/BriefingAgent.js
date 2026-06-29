"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BriefingAgent = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const BaseAgent_1 = require("./BaseAgent");
class BriefingAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'briefing-agent',
            name: 'Briefing Agent',
            description: 'Generates daily briefings using Claude',
            version: '1.0.0',
            capabilities: ['briefing'],
        };
    }
    canHandle(task) {
        return task.capability === 'briefing';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        const context = task.input['context'];
        const userName = ctx.userDisplayName ?? 'there';
        try {
            const client = new sdk_1.default({ apiKey: ctx.apiKey });
            const contextText = context
                ? Object.entries(context)
                    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                    .join('\n')
                : 'No context provided.';
            const response = await client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 1024,
                thinking: { type: 'enabled', budget_tokens: 5000 },
                system: `You are ARIA, a personal AI secretary. Generate a concise, friendly morning briefing for ${userName}. Be warm and professional. Keep it under 200 words.`,
                messages: [{ role: 'user', content: `Here is today's context:\n${contextText}\n\nGenerate a morning briefing.` }],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            const briefing = textBlock?.type === 'text' ? textBlock.text : '';
            const tokenUsage = response.usage
                ? { input: response.usage.input_tokens, output: response.usage.output_tokens }
                : undefined;
            return this.makeResult(task, ctx, { briefing }, briefing, startMs, tokenUsage);
        }
        catch (err) {
            return this.makeErrorResult(task, ctx, err, startMs);
        }
    }
}
exports.BriefingAgent = BriefingAgent;
//# sourceMappingURL=BriefingAgent.js.map