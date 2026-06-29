import type { ContextSnapshot } from './ContextTypes'
import type { MemoryBlock } from './MemoryTypes'

/** A structured recommendation produced by the Decision Engine. */
export interface Decision {
  title: string
  reason: string
  /** Confidence 0–1. Used for sorting and optional filtering. */
  confidence: number
  /** Natural-language suggestion for what ARIA could do or say. */
  recommendedAction: string
  /** Priority 0–100. Higher decisions appear first in the prompt. */
  priority: number
  /** ISO timestamp after which this recommendation is no longer relevant. */
  expiresAt?: string
}

/** A scored priority record for a single item. */
export interface PriorityScore {
  itemId: string
  itemType: 'task' | 'reminder' | 'contact'
  score: number
  factors: string[]
}

/** Implement to add a new source of proactive recommendations. */
export interface DecisionProvider {
  readonly name: string
  generate(context: ContextSnapshot, memory: MemoryBlock[]): Promise<Decision[]>
}

/** Tracks performance of a single pipeline run. */
export interface IntelligenceMetrics {
  executionTimeMs: number
  cacheHits: number
  cacheMisses: number
  memoryBlocksTotal: number
  memoryBlocksUsed: number
  contextSizeChars: number
  decisionCount: number
  promptSizeChars: number
}

/** Stored in Firestore when debugMode = true. */
export interface DebugSnapshot {
  userId: string
  timestamp: string
  metrics: IntelligenceMetrics
  promptPreview: string
  memoryBlockTitles: string[]
  decisionTitles: string[]
}
