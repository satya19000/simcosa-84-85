/**
 * WhisperBatchProvider.ts — batch transcript processing via AI Gateway.
 *
 * Uses AI Gateway's completion endpoint to process transcript text.
 * Does NOT call Whisper or any provider API directly.
 * Does NOT embed API keys.
 *
 * Use case: after a voiceNote session where text has been collected,
 * pass the text through the AI Gateway for cleanup, correction, or analysis.
 */

import type { AIGateway } from '../../ai-gateway/AIGateway'

export interface WhisperBatchResult {
  processedText: string
  language?: string
  confidence?: number
  modelUsed?: string
}

export class WhisperBatchProvider {
  readonly name = 'WhisperBatch'

  constructor(private readonly aiGateway: AIGateway) {}

  /**
   * Process and clean up transcript text via AI Gateway.
   * Routes through AI Gateway — no direct Whisper API calls, no API keys here.
   */
  async processTranscriptText(input: {
    tenantId: string
    userId: string
    rawText: string
    language?: string
  }): Promise<WhisperBatchResult> {
    const response = await this.aiGateway.complete({
      tenantId: input.tenantId,
      userId: input.userId,
      taskType: 'summarization',
      systemPrompt: 'You are a transcript editor. Clean up the provided speech-to-text transcript: fix punctuation, capitalization, and obvious errors. Preserve the speaker\'s meaning exactly. Return only the cleaned transcript text.',
      userMessage: `Language hint: ${input.language ?? 'unknown'}\n\nRaw transcript:\n${input.rawText}`,
      history: [],
    })

    return {
      processedText: response.text ?? input.rawText,
      language: input.language,
      modelUsed: response.model,
    }
  }
}
