"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlannerAgent = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const BaseAgent_1 = require("./BaseAgent");
/**
 * Analyzes user intent and produces a task graph for the Orchestrator.
 * Never executes domain actions directly — only planning.
 */
class PlannerAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'planner',
            name: 'Planner Agent',
            description: 'Analyzes user intent and decomposes it into agent tasks',
            version: '1.0.0',
            capabilities: ['plan'],
        };
    }
    canHandle(task) {
        return task.capability === 'plan';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        const userMessage = String(task.input['message'] ?? '');
        const conversationHistory = task.input['history'];
        try {
            const client = new sdk_1.default({ apiKey: ctx.apiKey });
            const systemPrompt = `You are ARIA's Planner Agent. Analyze the user's request and return a JSON object with:
{
  "intent": {
    "primary": "<capability>",
    "secondary": ["<capability>"],
    "confidence": 0-1,
    "reasoning": "<why>",
    "suggestedMode": "sequential|parallel|pipeline"
  },
  "tasks": [
    {
      "taskId": "t1",
      "capability": "<one of: plan|calendar|tasks|reminders|contacts|memory|workflow|notification|voice|briefing|knowledge|search|validation|email|whatsapp|maps|finance|health|document|ocr|automation>",
      "description": "<what this task does>",
      "input": { <relevant keys from user message> },
      "dependsOn": [],
      "priority": 50
    }
  ],
  "assembledResponse": "<optional: if no tasks needed, put the direct answer here>"
}

Capabilities: plan, calendar, tasks, reminders, contacts, memory, workflow, notification, voice, briefing, knowledge, search, validation.
Only include tasks that are actually needed. For simple questions use knowledge or search. For simple CRUD use tasks/reminders/contacts.
Do NOT include yourself (plan) in the task list.
Respond ONLY with valid JSON.`;
            const messages = [];
            if (conversationHistory) {
                for (const h of conversationHistory.slice(-6)) {
                    messages.push({ role: h.role, content: h.content });
                }
            }
            messages.push({ role: 'user', content: userMessage });
            const response = await client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 2048,
                thinking: { type: 'enabled', budget_tokens: 5000 },
                system: systemPrompt,
                messages,
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            const raw = textBlock?.type === 'text' ? textBlock.text : '';
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('PlannerAgent: no JSON in response');
            const parsed = JSON.parse(jsonMatch[0]);
            // Stamp required fields onto each task
            const now = new Date().toISOString();
            const enrichedTasks = (parsed.tasks ?? []).map((t, i) => ({
                taskId: t.taskId ?? `${ctx.graphRunId}-t${i + 1}`,
                graphRunId: ctx.graphRunId,
                userId: ctx.userId,
                capability: t.capability,
                description: t.description ?? '',
                input: t.input ?? {},
                dependsOn: t.dependsOn ?? [],
                status: 'pending',
                priority: t.priority ?? 50,
                createdAt: now,
                attempts: 0,
            }));
            const output = {
                intent: parsed.intent,
                tasks: enrichedTasks,
                assembledResponse: parsed.assembledResponse,
            };
            const tokenUsage = response.usage
                ? { input: response.usage.input_tokens, output: response.usage.output_tokens }
                : undefined;
            return this.makeResult(task, ctx, output, `Planned ${enrichedTasks.length} task(s)`, startMs, tokenUsage);
        }
        catch (err) {
            return this.makeErrorResult(task, ctx, err, startMs);
        }
    }
}
exports.PlannerAgent = PlannerAgent;
//# sourceMappingURL=PlannerAgent.js.map