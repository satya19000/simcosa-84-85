import Anthropic from '@anthropic-ai/sdk'
import type { DocumentRecord, DocumentSummaryRecord } from './DocumentTypes'
import type { DocumentConfig } from './DocumentConfig'

export class DocumentSummarizer {
  private readonly client: Anthropic

  constructor(
    private readonly config: DocumentConfig,
    apiKey: string
  ) {
    this.client = new Anthropic({ apiKey })
  }

  async summarize(document: DocumentRecord, text: string): Promise<DocumentSummaryRecord> {
    if (text.length < 30) return this.empty(document.id, document.userId)

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
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      const raw = textBlock?.type === 'text' ? textBlock.text : '{}'
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) return this.empty(document.id, document.userId)
      const parsed = JSON.parse(match[0])

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
      }
    } catch {
      return this.empty(document.id, document.userId)
    }
  }

  private empty(documentId: string, userId: string): DocumentSummaryRecord {
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
    }
  }
}
