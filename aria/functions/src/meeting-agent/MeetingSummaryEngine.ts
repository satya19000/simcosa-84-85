/**
 * MeetingSummaryEngine.ts — generates meeting summaries via AI Gateway.
 *
 * All AI processing routes through the AI Gateway (no direct API keys).
 * Summary generation is triggered only after a session ends.
 */

import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { AIGateway } from '../ai-gateway/AIGateway'
import type { MeetingSummary } from './MeetingTypes'
import { MeetingLogger } from './MeetingLogger'

const SUMMARIES_COL = (tenantId: string) => `tenants/${tenantId}/meetingSummaries`

export class MeetingSummaryEngine {
  private readonly logger = new MeetingLogger()

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly aiGateway: AIGateway
  ) {}

  /**
   * Generate a full meeting summary from transcript text via AI Gateway.
   * Routes through AI Gateway — no direct provider calls, no API keys in this file.
   */
  async generateSummary(input: {
    sessionId: string
    tenantId: string
    userId: string
    sessionTitle: string
    transcriptText: string
    language?: string
  }): Promise<MeetingSummary> {
    const prompt = this.buildSummaryPrompt(input.sessionTitle, input.transcriptText)

    const response = await this.aiGateway.complete({
      tenantId: input.tenantId,
      userId: input.userId,
      taskType: 'summarization',
      systemPrompt: 'You are an expert meeting summarizer. Extract structured information from the provided meeting transcript.',
      userMessage: prompt,
      history: [],
    })

    const parsed = this.parseSummaryResponse(response.text ?? '')
    const summaryId = uuidv4()
    const now = new Date().toISOString()

    const summary: MeetingSummary = {
      summaryId,
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      userId: input.userId,
      ...parsed,
      generatedByAI: true,
      modelUsed: response.model,
      createdAt: now,
      updatedAt: now,
    }

    await this.db.collection(SUMMARIES_COL(input.tenantId)).doc(summaryId).set(summary)
    this.logger.log('summary_generated', input.sessionId, `summaryId=${summaryId}`)
    return summary
  }

  async getSummary(tenantId: string, sessionId: string): Promise<MeetingSummary | null> {
    const snap = await this.db
      .collection(SUMMARIES_COL(tenantId))
      .where('sessionId', '==', sessionId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get()
    return snap.empty ? null : (snap.docs[0].data() as MeetingSummary)
  }

  private buildSummaryPrompt(title: string, transcript: string): string {
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
}`
  }

  private parseSummaryResponse(text: string): Omit<MeetingSummary, 'summaryId' | 'sessionId' | 'tenantId' | 'userId' | 'generatedByAI' | 'modelUsed' | 'createdAt' | 'updatedAt'> {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
        return {
          shortSummary: String(parsed.shortSummary ?? ''),
          executiveSummary: String(parsed.executiveSummary ?? ''),
          decisionsMade: Array.isArray(parsed.decisionsMade) ? parsed.decisionsMade as string[] : [],
          actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems as string[] : [],
          deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines as string[] : [],
          risks: Array.isArray(parsed.risks) ? parsed.risks as string[] : [],
          pendingQuestions: Array.isArray(parsed.pendingQuestions) ? parsed.pendingQuestions as string[] : [],
          peopleMentioned: Array.isArray(parsed.peopleMentioned) ? parsed.peopleMentioned as string[] : [],
          documentsMentioned: Array.isArray(parsed.documentsMentioned) ? parsed.documentsMentioned as string[] : [],
          followUpRecommendations: Array.isArray(parsed.followUpRecommendations) ? parsed.followUpRecommendations as string[] : [],
        }
      }
    } catch {
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
    }
  }
}
