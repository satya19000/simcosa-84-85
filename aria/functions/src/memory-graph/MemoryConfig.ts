export interface MemoryConfig {
  /** Maximum nodes returned by a search query */
  maxSearchResults: number
  /** Default relationship traversal depth */
  defaultTraversalDepth: number
  /** Node importance threshold below which nodes are candidates for compression */
  compressionThreshold: number
  /** Token budget for compressed memory context */
  compressionTokenBudget: number
  /** Time-to-live for in-memory index cache (ms) */
  indexCacheTTLMs: number
  /** Minimum confidence to persist an AI-inferred edge */
  minEdgeConfidence: number
  /** Enable analytics collection */
  analyticsEnabled: boolean
  /** Score decay per day for recency scoring */
  recencyDecayPerDay: number
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxSearchResults: 20,
  defaultTraversalDepth: 3,
  compressionThreshold: 30,
  compressionTokenBudget: 4000,
  indexCacheTTLMs: 5 * 60 * 1000,
  minEdgeConfidence: 0.6,
  analyticsEnabled: true,
  recencyDecayPerDay: 2,
}

export function resolveMemoryConfig(override?: Partial<MemoryConfig>): MemoryConfig {
  return { ...DEFAULT_MEMORY_CONFIG, ...override }
}
