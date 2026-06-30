"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenEstimator = void 0;
/**
 * Heuristic token estimator — NOT a real tokenizer (no tiktoken/SentencePiece
 * dependency added). Uses the well-known ~4 chars-per-token English-text
 * approximation. Good enough for routing/cost-ceiling decisions; actual
 * billed token counts always come from each provider's own `usage` field in
 * the response (see ModelProvider.complete()'s NormalizedUsage).
 */
class TokenEstimator {
    estimate(text) {
        if (!text)
            return 0;
        return Math.ceil(text.length / TokenEstimator.CHARS_PER_TOKEN);
    }
    estimateMessages(messages) {
        return messages.reduce((sum, m) => sum + this.estimate(m.content), 0);
    }
}
exports.TokenEstimator = TokenEstimator;
TokenEstimator.CHARS_PER_TOKEN = 4;
//# sourceMappingURL=TokenEstimator.js.map