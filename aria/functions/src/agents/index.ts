import type { Agent } from './Agent'
import { AgentRegistry } from './AgentRegistry'
import { AgentHealthMonitor } from './AgentHealth'
import { AgentManager } from './AgentManager'
import { AgentScheduler } from './AgentScheduler'
import { Orchestrator } from './Orchestrator'
import { PlannerAgent } from './builtin/PlannerAgent'
import { TaskAgent } from './builtin/TaskAgent'
import { ReminderAgent } from './builtin/ReminderAgent'
import { CalendarAgent } from './builtin/CalendarAgent'
import { ContactAgent } from './builtin/ContactAgent'
import { MemoryAgent } from './builtin/MemoryAgent'
import { WorkflowAgent } from './builtin/WorkflowAgent'
import { NotificationAgent } from './builtin/NotificationAgent'
import { VoiceAgent } from './builtin/VoiceAgent'
import { BriefingAgent } from './builtin/BriefingAgent'
import { KnowledgeAgent } from './builtin/KnowledgeAgent'
import { SearchAgent } from './builtin/SearchAgent'
import { ValidatorAgent } from './builtin/ValidatorAgent'
import {
  EmailAgent,
  WhatsAppAgent,
  MapsAgent,
  FinanceAgent,
  HealthAgent,
  DocumentAgent,
  OCRAgent,
  AutomationAgent,
} from './builtin/PlaceholderAgents'

// ── Singleton warm-instance state ──────────────────────────────────────────

let _registry: AgentRegistry | null = null
let _health: AgentHealthMonitor | null = null
let _manager: AgentManager | null = null
let _scheduler: AgentScheduler | null = null
let _orchestrator: Orchestrator | null = null
let _initializedAt = 0

const REINIT_TTL_MS = 30 * 60 * 1000 // 30 min

async function bootstrap(): Promise<{
  registry: AgentRegistry
  health: AgentHealthMonitor
  manager: AgentManager
  scheduler: AgentScheduler
  orchestrator: Orchestrator
}> {
  const now = Date.now()
  if (_registry && _manager && _scheduler && _orchestrator && now - _initializedAt < REINIT_TTL_MS) {
    return { registry: _registry, health: _health!, manager: _manager, scheduler: _scheduler, orchestrator: _orchestrator }
  }

  const registry = new AgentRegistry()
  const health = new AgentHealthMonitor()
  const manager = new AgentManager(registry, health)

  const agents: Agent[] = [
    new PlannerAgent(),
    new TaskAgent(),
    new ReminderAgent(),
    new CalendarAgent(),
    new ContactAgent(),
    new MemoryAgent(),
    new WorkflowAgent(),
    new NotificationAgent(),
    new VoiceAgent(),
    new BriefingAgent(),
    new KnowledgeAgent(),
    new SearchAgent(),
    new ValidatorAgent(),
    // Placeholders (registered but disabled via canHandle returning false)
    EmailAgent,
    WhatsAppAgent,
    MapsAgent,
    FinanceAgent,
    HealthAgent,
    DocumentAgent,
    OCRAgent,
    AutomationAgent,
  ]

  await manager.registerAll(agents)

  const orchestrator = new Orchestrator(registry, health)
  const scheduler = new AgentScheduler(manager)

  _registry = registry
  _health = health
  _manager = manager
  _scheduler = scheduler
  _orchestrator = orchestrator
  _initializedAt = now

  return { registry, health, manager, scheduler, orchestrator }
}

export { bootstrap }

// Re-export public API
export type { Agent } from './Agent'
export type { AgentManifest } from './Agent'
export type { AgentTask } from './AgentTask'
export type { AgentResult, GraphRunResult } from './AgentResult'
export type { AgentContext } from './AgentContext'
export type { AgentConfig } from './AgentConfig'
export { AgentRegistry } from './AgentRegistry'
export { AgentHealthMonitor } from './AgentHealth'
export { AgentManager } from './AgentManager'
export { AgentScheduler } from './AgentScheduler'
export { Orchestrator } from './Orchestrator'
export type { OrchestratorRunOptions } from './Orchestrator'
export { agentEventBus } from './AgentEvents'
