# ARIA Intelligence Layer

The Intelligence Layer is the brain between the user's message and Claude. Every chat request passes through this pipeline before a single token reaches the model.

## Pipeline

```
User Message
  ↓
ContextEngine     — Builds a live snapshot of the user's world (tasks, reminders, contacts, briefing)
  ↓
MemoryEngine      — Converts context into ranked, compact MemoryBlocks for the prompt
  ↓
PriorityEngine    — Scores every item 0–100 so the most urgent content reaches Claude first
  ↓
DecisionEngine    — Generates proactive recommendations from context + memory
  ↓
PromptAssembler   — Packs everything into a token-budgeted system prompt
  ↓
Claude            — Receives a fully-informed, structured prompt
  ↓
Tool Calls + Action Engine
```

## Files

| File | Responsibility |
|---|---|
| `EngineConfig.ts` | All constants. No magic numbers elsewhere. |
| `ContextTypes.ts` | ContextSnapshot, ContextProvider interface, summary shapes |
| `MemoryTypes.ts` | MemoryBlock, MemoryProvider interface |
| `DecisionTypes.ts` | Decision, DecisionProvider, PriorityScore, IntelligenceMetrics |
| `ContextEngine.ts` | Parallelised Firestore reads → ContextSnapshot, with TTL cache |
| `MemoryEngine.ts` | Provider registry + built-in task/reminder/contact/briefing blocks |
| `PriorityEngine.ts` | Scoring functions for tasks, reminders, contacts (0–100) |
| `DecisionEngine.ts` | Provider registry + default rule-based recommendation generator |
| `PromptAssembler.ts` | Budget-aware prompt assembly with section ordering |
| `index.ts` | Main entry `runIntelligencePipeline()`, re-exports extension points |

## Provider Architecture

Every engine supports plugins. Register providers at module load time — no editing engine code.

```typescript
// Add a new memory source
import { registerMemoryProvider } from './intelligence'

registerMemoryProvider({
  name: 'financial-summary',
  type: 'preferences',
  async load(userId, db, message) {
    // ... load from Firestore
    return [{ type: 'preferences', title: 'Finances', summary: '...', priority: 30, sizeChars: 0, data: {} }]
  },
})

// Add a new decision rule
import { registerDecisionProvider } from './intelligence'

registerDecisionProvider({
  name: 'meeting-prep',
  async generate(context, memory) {
    // ... inspect context
    return [{ title: '...', reason: '...', confidence: 0.8, recommendedAction: '...', priority: 50 }]
  },
})
```

## Prompt Assembly

The assembler respects a character budget (`maxPromptChars`, default 24,000 ≈ 6K tokens).

Section order and trim policy:

1. **System** — Never trimmed. ARIA personality + temporal context.
2. **Current Context** — Always included. Compact date/time/alert lines.
3. **Memory** — Blocks ordered by priority. Trimmed from the bottom if budget is tight.
4. **Recommendations** — Included only if budget remains after memory.

The user message is passed separately as the `messages` array — never packed into the system prompt.

## Caching

Two independent in-memory caches (Map + timestamp):

| Cache | Key | TTL |
|---|---|---|
| Context | `ctx:{userId}` | 60s default |
| Memory per provider | `mem:{userId}:{providerName}` | 60s default |

Cache hits are counted in `IntelligenceMetrics`. Cold-start cache misses are expected on the first request per Cloud Function instance.

## Performance Metrics

Every pipeline run returns `IntelligenceMetrics`:

```typescript
{
  executionTimeMs: number    // Total pipeline time
  cacheHits: number          // Context + memory cache hits
  cacheMisses: number        // Context + memory cache misses
  memoryBlocksTotal: number  // Blocks produced before budget trim
  memoryBlocksUsed: number   // Blocks that fit within budget
  contextSizeChars: number   // Raw context snapshot size
  decisionCount: number      // Recommendations generated
  promptSizeChars: number    // Final assembled prompt size
}
```

Metrics are stored on the Firestore chat session document (`lastIntelligenceMetrics`) for monitoring.

## Debug Mode

Set `debugMode: true` in `EngineConfig` to write a `DebugSnapshot` to `PipelineOutput.debugSnapshot`. The snapshot includes:
- Full metrics
- First 500 chars of assembled prompt
- Memory block titles and priorities
- Decision titles and confidence

Never enable debug mode for all users in production.

## Priority Scoring (0–100)

### Tasks
| Factor | Points |
|---|---|
| Overdue | +45 |
| Due in < 2h | +30 |
| Due today | +20 |
| Due in 3 days | +10 |
| Priority: critical | +35 |
| Priority: high | +20 |
| Priority: low | −10 |

### Reminders
| Factor | Points |
|---|---|
| Overdue | +40 |
| Imminent (< 2h) | +35 |
| Today | +20 |
| Recurring | +5 |

### Contacts
| Factor | Points |
|---|---|
| Named in user message | +50 |
| Family / client / manager | +12–15 |
| Friend | +8 |
| Colleague | +5 |

## Adding a Phase 4.1 Module

1. Create your provider class implementing `MemoryProvider` or `DecisionProvider`
2. Call `registerMemoryProvider()` or `registerDecisionProvider()` in your module's initialization
3. Import that module in `functions/src/intelligence/index.ts` or from the feature's own file
4. No changes to engine files required

## Future Extension Points (Phase 4.1+)

- **Health/Wellness Provider** — register `MemoryProvider` pulling from `users/{uid}/health`
- **Financial Summary Provider** — EMIs, SIPs, upcoming payments
- **Email Digest Provider** — summaries once email integration lands
- **Smart Rescheduler** — `DecisionProvider` that suggests moving low-priority tasks when overloaded
- **Meeting Prep Provider** — context blocks for upcoming calendar events
- **Streak Tracker** — habit tracking memory blocks
