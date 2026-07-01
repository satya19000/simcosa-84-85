"use strict";
/**
 * MeetingSummaryEngine.ts — generates meeting summaries via AI Gateway.
 *
 * All AI processing routes through the AI Gateway (no direct API keys).
 * Summary generation is triggered only after a session ends.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingSummaryEngine = void 0;
const uuid_1 = require("uuid");
const MeetingLogger_1 = require("./MeetingLogger");
const SUMMARIES_COL = (tenantId) => `tenants/${tenantId}/meetingSummaries`;
class MeetingSummaryEngine {
    constructor(db, aiGateway) {
        this.db = db;
        this.aiGateway = aiGateway;
        this.logger = new MeetingLogger_1.MeetingLogger();
    }
    /**
     * Generate a full meeting summary from transcript text via AI Gateway.
     * Routes through AI Gateway — no direct provider calls, no API keys in this file.
     */
    async generateSummary(input) {
        const prompt = this.buildSummaryPrompt(input.sessionTitle, input.transcriptText);
        const response = await this.aiGateway.complete({
            tenantId: input.tenantId,
            userId: input.userId,
            taskType: 'summarization',
            systemPrompt: 'You are an expert meeting summarizer. Extract structured information from the provided meeting transcript.',
            userMessage: prompt,
            history: [],
        });
        const parsed = this.parseSummaryResponse(response.text ?? '');
        const summaryId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const summary = {
            summaryId,
            sessionId: input.sessionId,
            tenantId: input.tenantId,
            userId: input.userId,
            ...parsed,
            generatedByAI: true,
            modelUsed: response.model,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(SUMMARIES_COL(input.tenantId)).doc(summaryId).set(summary);
        this.logger.log('summary_generated', input.sessionId, `summaryId=${summaryId}`);
        return summary;
    }
    async getSummary(tenantId, sessionId) {
        const snap = await this.db
            .collection(SUMMARIES_COL(tenantId))
            .where('sessionId', '==', sessionId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        return snap.empty ? null : snap.docs[0].data();
    }
    buildSummaryPrompt(title, transcript) {
        return `Meeting: "${title}"

Transcript:
${transcript}

Please provide a structured JSON response with exactly these fields:
{
  "shortSummary": "one-sentence summary",
  "executiveSummary": "2-3 paragraph executive summary",
  "decisionsMade": ["decision 1", "decision 2"],
  "actionItems": ["action 1", "action 2"],
  "deadlines": ["deadline 1"],
  "risks": ["risk 1"],
  "pendingQuestions": ["question 1"],
  "peopleMentioned": ["name 1", "name 2"],
  "documentsMentioned": ["doc 1"],
  "followUpRecommendations": ["recommendation 1"]
}`;
    }
    parseSummaryResponse(text) {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    shortSummary: String(parsed.shortSummary ?? ''),
                    executiveSummary: String(parsed.executiveSummary ?? ''),
                    decisionsMade: Array.isArray(parsed.decisionsMade) ? parsed.decisionsMade : [],
                    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
                    deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
                    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
                    pendingQuestions: Array.isArray(parsed.pendingQuestions) ? parsed.pendingQuestions : [],
                    peopleMentioned: Array.isArray(parsed.peopleMentioned) ? parsed.peopleMentioned : [],
                    documentsMentioned: Array.isArray(parsed.documentsMentioned) ? parsed.documentsMentioned : [],
                    followUpRecommendations: Array.isArray(parsed.followUpRecommendations) ? parsed.followUpRecommendations : [],
                };
            }
        }
        catch {
            // Fall through to empty defaults
        }
        return {
            shortSummary: text.slice(0, 200),
            executiveSummary: text,
            decisionsMade: [],
            actionItems: [],
            deadlines: [],
            risks: [],
            pendingQuestions: [],
            peopleMentioned: [],
            documentsMentioned: [],
            followUpRecommendations: [],
        };
    }
}
exports.MeetingSummaryEngine = MeetingSummaryEngine;
//# sourceMappingURL=MeetingSummaryEngine.js.map