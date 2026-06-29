"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSummarizer = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class DocumentSummarizer {
    constructor(config, apiKey) {
        this.config = config;
        this.client = new sdk_1.default({ apiKey });
    }
    async summarize(document, text) {
        if (text.length < 30)
            return this.empty(document.id, document.userId);
        try {
            const response = await this.client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: this.config.summaryTokenBudget,
                messages: [
                    {
                        role: 'user',
                        content: `Analyze this document and return a JSON object:
{
  "shortSummary": "1-2 sentence summary",
  "executiveSummary": "3-5 sentence executive summary",
  "bulletPoints": ["key point 1", "key point 2"],
  "actionItems": ["action 1"],
  "deadlines": ["deadline string"],
  "riskPoints": ["risk 1"],
  "timeline": ["event 1"]
}

Document title: "${document.title}"
Category: ${document.category}
Text (first 3000 chars): ${text.slice(0, 3000)}

Return ONLY valid JSON.`,
                    },
                ],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            const raw = textBlock?.type === 'text' ? textBlock.text : '{}';
            const match = raw.match(/\{[\s\S]*\}/);
            if (!match)
                return this.empty(document.id, document.userId);
            const parsed = JSON.parse(match[0]);
            return {
                documentId: document.id,
                userId: document.userId,
                shortSummary: parsed.shortSummary ?? '',
                executiveSummary: parsed.executiveSummary ?? '',
                bulletPoints: parsed.bulletPoints ?? [],
                actionItems: parsed.actionItems ?? [],
                deadlines: parsed.deadlines ?? [],
                riskPoints: parsed.riskPoints ?? [],
                timeline: parsed.timeline ?? [],
                generatedAt: new Date().toISOString(),
            };
        }
        catch {
            return this.empty(document.id, document.userId);
        }
    }
    empty(documentId, userId) {
        return {
            documentId,
            userId,
            shortSummary: '',
            executiveSummary: '',
            bulletPoints: [],
            actionItems: [],
            deadlines: [],
            riskPoints: [],
            timeline: [],
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.DocumentSummarizer = DocumentSummarizer;
//# sourceMappingURL=DocumentSummarizer.js.map