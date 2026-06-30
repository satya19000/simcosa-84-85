"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptNormalizer = void 0;
/**
 * Converts ARIA's internal prompt shape (system prompt + history + tools +
 * context/memory sections) into the provider-agnostic NormalizedPrompt that
 * every ModelProvider.complete()/stream() consumes. Each provider then maps
 * NormalizedPrompt into its own wire format internally — this class never
 * knows about any specific provider's API shape.
 */
class PromptNormalizer {
    build(input) {
        const history = input.history.map((h) => ({ role: h.role, content: h.content }));
        return {
            systemPrompt: input.systemPrompt,
            contextSections: input.contextSections ?? [],
            memoryBlocks: input.memoryBlocks ?? [],
            history,
            userMessage: input.userMessage,
            tools: input.tools ?? [],
            pendingToolResults: [],
            structuredOutputHint: input.structuredOutputHint ?? null,
            maxTokens: input.maxTokens,
        };
    }
    withToolResult(prompt, toolCallId, toolName, content, isError = false) {
        return {
            ...prompt,
            pendingToolResults: [...(prompt.pendingToolResults ?? []), { toolCallId, toolName, content, isError }],
        };
    }
}
exports.PromptNormalizer = PromptNormalizer;
//# sourceMappingURL=PromptNormalizer.js.map