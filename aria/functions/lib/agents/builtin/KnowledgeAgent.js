"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeAgent = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const BaseAgent_1 = require("./BaseAgent");
class KnowledgeAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'knowledge-agent',
            name: 'Knowledge Agent',
            description: 'Answers knowledge questions using Claude',
            version: '1.0.0',
            capabilities: ['knowledge'],
        };
    }
    canHandle(task) {
        return task.capability === 'knowledge';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        const question = String(task.input['question'] ?? task.input['message'] ?? '');
        const memoryContext = task.input['memoryContext'];
        if (!question) {
            return this.makeErrorResult(task, ctx, 'question is required', startMs);
        }
        try {
            const client = new sdk_1.default({ apiKey: ctx.apiKey });
            const systemPrompt = [
                `You are ARIA, a personal AI secretary for ${ctx.userDisplayName ?? 'the user'}.`,
                memoryContext ? `\nUser context:\n${memoryContext}` : '',
                '\nAnswer concisely and helpfully.',
            ].join('');
            const response = await client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 1024,
                thinking: { type: 'enabled', budget_tokens: 5000 },
                system: systemPrompt,
                messages: [{ role: 'user', content: question }],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            const answer = textBlock?.type === 'text' ? textBlock.text : '';
            const tokenUsage = response.usage
                ? { input: response.usage.input_tokens, output: response.usage.output_tokens }
                : undefined;
            return this.makeResult(task, ctx, { answer }, answer, startMs, tokenUsage);
        }
        catch (err) {
            return this.makeErrorResult(task, ctx, err, startMs);
        }
    }
}
exports.KnowledgeAgent = KnowledgeAgent;
//# sourceMappingURL=KnowledgeAgent.js.map