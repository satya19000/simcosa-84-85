import type { ModelProvider, CompleteOptions, StreamChunk } from './ModelProvider'
import type { NormalizedPrompt, NormalizedResponse } from './ModelTypes'

/**
 * Thin orchestration wrapper around ModelProvider.stream() that gives
 * AIGateway/Cloud Function call sites one place to add cross-cutting
 * concerns later (e.g. backpressure, max-duration cutoffs) without each
 * provider re-implementing them. Each provider remains responsible for the
 * actual streaming transport.
 */
export class StreamingManager {
  async run(
    provider: ModelProvider,
    prompt: NormalizedPrompt,
    options: CompleteOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<NormalizedResponse> {
    return provider.stream(prompt, options, onChunk)
  }
}
