"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationRouter = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const uuid_1 = require("uuid");
class CommunicationRouter {
    constructor(config, apiKey, analysisBudget, summaryBudget, replyBudget) {
        this.analysisBudget = analysisBudget;
        this.summaryBudget = summaryBudget;
        this.replyBudget = replyBudget;
        this.client = new sdk_1.default({ apiKey });
        void config;
    }
    // ── Conversation Intelligence ─────────────────────────────────────────────
    async analyzeThread(thread, messages) {
        const context = messages
            .map((m) => `[${m.from.name}]: ${m.body}`)
            .join('\n\n')
            .slice(0, 4000);
        try {
            const response = await this.client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: this.analysisBudget,
                thinking: { type: 'enabled', budget_tokens: 3000 },
                messages: [
                    {
                        role: 'user',
                        content: `Analyze this conversation thread and return JSON:
{
  "detectedItems": [
    { "type": "follow_up_needed|unanswered_question|meeting_request|deadline|commitment|promise|decision|risk_item|action_item", "description": "...", "confidence": 0.0-1.0, "extractedText": "...", "suggestedDate": "ISO date or null" }
  ],
  "sentiment": "positive|neutral|negative|urgent",
  "priority": "low|medium|high|critical",
  "topics": ["topic1"],
  "namedEntities": ["person or org name"]
}

Subject: ${thread.subject ?? '(no subject)'}
Provider: ${thread.providerType}
Messages:
${context}

Return ONLY valid JSON.`,
                    },
                ],
            });
            const block = response.content.find((b) => b.type === 'text');
            const raw = block?.type === 'text' ? block.text : '{}';
            const match = raw.match(/\{[\s\S]*\}/);
            if (!match)
                return this.emptyAnalysis(thread.id, thread.userId);
            const parsed = JSON.parse(match[0]);
            const detectedItems = parsed.detectedItems ?? [];
            const suggestions = this.buildSuggestions(thread.id, detectedItems);
            return {
                id: (0, uuid_1.v4)(),
                threadId: thread.id,
                userId: thread.userId,
                detectedItems,
                suggestions,
                sentiment: parsed.sentiment,
                priority: parsed.priority,
                topics: parsed.topics ?? [],
                namedEntities: parsed.namedEntities ?? [],
                analyzedAt: new Date().toISOString(),
            };
        }
        catch {
            return this.emptyAnalysis(thread.id, thread.userId);
        }
    }
    // ── Summary Generation ────────────────────────────────────────────────────
    async generateSummary(thread, messages, type = 'thread') {
        const context = messages
            .map((m) => `[${m.from.name}]: ${m.body}`)
            .join('\n\n')
            .slice(0, 6000);
        try {
            const response = await this.client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: this.summaryBudget,
                messages: [
                    {
                        role: 'user',
                        content: `Generate a ${type} summary of this conversation as JSON:
{
  "title": "short title",
  "summary": "2-3 paragraph summary",
  "bulletPoints": ["key point 1"],
  "actionItems": ["action 1"],
  "decisions": ["decision 1"],
  "participants": ["name 1"]
}

Subject: ${thread.subject ?? '(no subject)'}
Messages:
${context}

Return ONLY valid JSON.`,
                    },
                ],
            });
            const block = response.content.find((b) => b.type === 'text');
            const raw = block?.type === 'text' ? block.text : '{}';
            const match = raw.match(/\{[\s\S]*\}/);
            if (!match)
                return this.emptySummary(thread.id, thread.userId, type);
            const parsed = JSON.parse(match[0]);
            return {
                id: (0, uuid_1.v4)(),
                threadId: thread.id,
                userId: thread.userId,
                type,
                title: parsed.title ?? thread.subject ?? 'Conversation Summary',
                summary: parsed.summary ?? '',
                bulletPoints: parsed.bulletPoints ?? [],
                actionItems: parsed.actionItems ?? [],
                decisions: parsed.decisions ?? [],
                participants: parsed.participants ?? [],
                generatedAt: new Date().toISOString(),
            };
        }
        catch {
            return this.emptySummary(thread.id, thread.userId, type);
        }
    }
    // ── AI Reply Generator ────────────────────────────────────────────────────
    async generateReply(message, thread, tone) {
        const toneInstructions = {
            professional: 'Write a professional, clear, and concise reply.',
            short: 'Write a very short reply (2-3 sentences max).',
            formal: 'Write a formal, official reply using proper salutations.',
            friendly: 'Write a warm, friendly reply.',
            public_health: 'Write a reply in the context of public health communication, using appropriate terminology.',
            medical: 'Write a medically appropriate reply using clinical terminology where needed.',
        };
        try {
            const response = await this.client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: this.replyBudget,
                messages: [
                    {
                        role: 'user',
                        content: `${toneInstructions[tone]}

Do NOT send this automatically — this is a suggestion for the user to review.

Original message from ${message.from.name}:
Subject: ${message.subject ?? '(no subject)'}
${message.body.slice(0, 2000)}

Return ONLY the reply text, no explanations.`,
                    },
                ],
            });
            const block = response.content.find((b) => b.type === 'text');
            const body = block?.type === 'text' ? block.text.trim() : '';
            return {
                id: (0, uuid_1.v4)(),
                threadId: thread.id,
                messageId: message.id,
                tone,
                body,
                subject: message.subject ? `Re: ${message.subject}` : undefined,
                generatedAt: new Date().toISOString(),
            };
        }
        catch {
            return {
                id: (0, uuid_1.v4)(),
                threadId: thread.id,
                messageId: message.id,
                tone,
                body: '',
                generatedAt: new Date().toISOString(),
            };
        }
    }
    // ── Helpers ────────────────────────────────────────────────────────────────
    buildSuggestions(threadId, items) {
        const typeMap = {
            action_item: 'create_task',
            deadline: 'create_reminder',
            meeting_request: 'schedule_meeting',
            commitment: 'create_task',
            promise: 'create_reminder',
        };
        const now = new Date().toISOString();
        return items
            .filter((item) => item.confidence >= 0.6 && typeMap[item.type])
            .map((item) => ({
            id: (0, uuid_1.v4)(),
            threadId,
            type: typeMap[item.type],
            title: item.description.slice(0, 80),
            description: item.description,
            confidence: item.confidence,
            detectedItem: item,
            createdAt: now,
        }));
    }
    emptyAnalysis(threadId, userId) {
        return {
            id: (0, uuid_1.v4)(),
            threadId,
            userId,
            detectedItems: [],
            suggestions: [],
            topics: [],
            namedEntities: [],
            analyzedAt: new Date().toISOString(),
        };
    }
    emptySummary(threadId, userId, type) {
        return {
            id: (0, uuid_1.v4)(),
            threadId,
            userId,
            type,
            title: 'Summary',
            summary: '',
            bulletPoints: [],
            actionItems: [],
            decisions: [],
            participants: [],
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.CommunicationRouter = CommunicationRouter;
//# sourceMappingURL=CommunicationRouter.js.map