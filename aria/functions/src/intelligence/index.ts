import type * as admin from 'firebase-admin'
import { buildContext } from './ContextEngine'
import { buildMemory } from './MemoryEngine'
import { generateDecisions } from './DecisionEngine'
import { assemblePrompt } from './PromptAssembler'
import { resolveConfig } from './EngineConfig'
import type { EngineConfig } from './EngineConfig'
import type { ContextSnapshot } from './ContextTypes'
import type { MemoryBlock } from './MemoryTypes'
import type { Decision, IntelligenceMetrics, DebugSnapshot } from './DecisionTypes'

// Re-export extension points so future modules can register without importing internals
export { registerContextProvider } from './ContextEngine'
export { registerMemoryProvider } from './MemoryEngine'
export { registerDecisionProvider } from './DecisionEngine'
export { registerPriorityProvider } from './PriorityEngine'

// Re-export types for consumers
export type { ContextSnapshot, TaskSummary, ReminderSummary, ContactSummary } from './ContextTypes'
export type { MemoryBlock, MemoryProvider } from './MemoryTypes'
export type { Decision, DecisionProvider, IntelligenceMetrics, DebugSnapshot } from './DecisionTypes'
export type { EngineConfig } from './EngineConfig'
export { DEFAULT_ENGINE_CONFIG, resolveConfig } from './EngineConfig'

// ── Main Pipeline ─────────────────────────────────────────────────────────────

export interface PipelineInput {
  userId: string
  db: admin.firestore.Firestore
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  /** Pre-built ARIA system base prompt (personality + temporal context). */
  systemBase: string
  config?: Partial<EngineConfig>
}

export interface PipelineOutput {
  assembledSystemPrompt: string
  context: ContextSnapshot
  memoryBlocks: MemoryBlock[]
  decisions: Decision[]
  metrics: IntelligenceMetrics
  debugSnapshot?: DebugSnapshot
}

export async function runIntelligencePipeline(input: PipelineInput): Promise<PipelineOutput> {
  const t0 = Date.now()
  const config = resolveConfig(input.config)

  // 1. Context Engine
  const { snapshot: context, cacheHit: ctxCacheHit } = await buildContext(
    input.userId,
    input.db,
    input.history.length,
    config
  )

  // 2. Memory Engine (uses context — no extra Firestore reads for built-ins)
  const { blocks: allMemoryBlocks, cacheHits: memCacheHits, cacheMisses: memCacheMisses } =
    await buildMemory(input.userId, input.db, context, input.message, config)

  // 3. Priority Engine is embedded in MemoryEngine (blocks already sorted by priority)

  // 4. Decision Engine
  const decisions = await generateDecisions(context, allMemoryBlocks, config)

  // 5. Prompt Assembler
  const assembled = assemblePrompt(
    input.systemBase,
    context,
    allMemoryBlocks,
    decisions,
    config
  )

  const executionTimeMs = Date.now() - t0

  const metrics: IntelligenceMetrics = {
    executionTimeMs,
    cacheHits: (ctxCacheHit ? 1 : 0) + memCacheHits,
    cacheMisses: (ctxCacheHit ? 0 : 1) + memCacheMisses,
    memoryBlocksTotal: allMemoryBlocks.length,
    memoryBlocksUsed: assembled.memoryBlocksUsed,
    contextSizeChars: context.sizeChars,
    decisionCount: decisions.length,
    promptSizeChars: assembled.sizeChars,
  }

  const output: PipelineOutput = {
    assembledSystemPrompt: assembled.systemPrompt,
    context,
    memoryBlocks: allMemoryBlocks,
    decisions,
    metrics,
  }

  if (config.debugMode) {
    output.debugSnapshot = {
      userId: input.userId,
      timestamp: new Date().toISOString(),
      metrics,
      promptPreview: assembled.systemPrompt.slice(0, 500),
      memoryBlockTitles: allMemoryBlocks.map((b) => `${b.title} (p:${b.priority})`),
      decisionTitles: decisions.map((d) => `${d.title} (c:${Math.round(d.confidence * 100)}%)`),
    }
  }

  return output
}
