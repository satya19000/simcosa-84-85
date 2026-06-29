/** Configures every engine in the Intelligence Layer. All values must be explicit — no magic numbers anywhere else. */
export interface EngineConfig {
  /** Maximum assembled prompt size in characters (~4 chars per token). */
  maxPromptChars: number
  /** Maximum MemoryBlocks forwarded to PromptAssembler. */
  maxMemoryBlocks: number
  /** In-memory cache TTL in milliseconds. */
  cacheTTLMs: number
  /** Maximum Decision recommendations generated per request. */
  maxRecommendations: number
  /** Conversation history turns forwarded to Claude. */
  maxConversationMessages: number
  /** IANA fallback timezone when user profile lacks one. */
  timezoneFallback: string
  /** Store debug data in Firestore for developer inspection. Never enable for all users. */
  debugMode: boolean
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  maxPromptChars: 24_000,
  maxMemoryBlocks: 12,
  cacheTTLMs: 60_000,
  maxRecommendations: 5,
  maxConversationMessages: 20,
  timezoneFallback: 'Asia/Kolkata',
  debugMode: false,
}

export function resolveConfig(override?: Partial<EngineConfig>): EngineConfig {
  return { ...DEFAULT_ENGINE_CONFIG, ...override }
}
