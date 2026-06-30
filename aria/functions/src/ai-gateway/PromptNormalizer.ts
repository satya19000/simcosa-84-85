import type { NormalizedPrompt, NormalizedMessage, NormalizedToolDefinition } from './ModelTypes'

export interface BuildPromptInput {
  systemPrompt: string
  history: { role: 'user' | 'assistant'; content: string }[]
  userMessage: string
  contextSections?: { title: string; content: string }[]
  memoryBlocks?: { label: string; content: string }[]
  tools?: NormalizedToolDefinition[]
  structuredOutputHint?: { description: string; schema?: Record<string, unknown> } | null
  maxTokens?: number
}

/**
 * Converts ARIA's internal prompt shape (system prompt + history + tools +
 * context/memory sections) into the provider-agnostic NormalizedPrompt that
 * every ModelProvider.complete()/stream() consumes. Each provider then maps
 * NormalizedPrompt into its own wire format internally — this class never
 * knows about any specific provider's API shape.
 */
export class PromptNormalizer {
  build(input: BuildPromptInput): NormalizedPrompt {
    const history: NormalizedMessage[] = input.history.map((h) => ({ role: h.role, content: h.content }))
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
    }
  }

  withToolResult(prompt: NormalizedPrompt, toolCallId: string, toolName: string, content: string, isError = false): NormalizedPrompt {
    return {
      ...prompt,
      pendingToolResults: [...(prompt.pendingToolResults ?? []), { toolCallId, toolName, content, isError }],
    }
  }
}
