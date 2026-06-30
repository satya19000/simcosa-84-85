/**
 * Heuristic token estimator — NOT a real tokenizer (no tiktoken/SentencePiece
 * dependency added). Uses the well-known ~4 chars-per-token English-text
 * approximation. Good enough for routing/cost-ceiling decisions; actual
 * billed token counts always come from each provider's own `usage` field in
 * the response (see ModelProvider.complete()'s NormalizedUsage).
 */
export class TokenEstimator {
  private static readonly CHARS_PER_TOKEN = 4

  estimate(text: string): number {
    if (!text) return 0
    return Math.ceil(text.length / TokenEstimator.CHARS_PER_TOKEN)
  }

  estimateMessages(messages: { content: string }[]): number {
    return messages.reduce((sum, m) => sum + this.estimate(m.content), 0)
  }
}
