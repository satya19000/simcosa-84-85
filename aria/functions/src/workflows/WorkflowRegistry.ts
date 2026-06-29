import type { WorkflowDefinition } from './Workflow'
import type { WorkflowId, TriggerType } from './WorkflowTypes'
import { validateWorkflow } from './WorkflowValidator'

/** In-memory registry of workflow definitions. Thread-safe for Cloud Function warm instances. */
export class WorkflowRegistry {
  private workflows = new Map<WorkflowId, WorkflowDefinition>()

  register(definition: WorkflowDefinition): void {
    const validation = validateWorkflow(definition)
    if (!validation.valid) {
      const messages = validation.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
      throw new Error(`Invalid workflow "${definition.id}": ${messages}`)
    }
    this.workflows.set(definition.id, definition)
  }

  unregister(id: WorkflowId): boolean {
    return this.workflows.delete(id)
  }

  get(id: WorkflowId): WorkflowDefinition | undefined {
    return this.workflows.get(id)
  }

  has(id: WorkflowId): boolean {
    return this.workflows.has(id)
  }

  list(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }

  listEnabled(): WorkflowDefinition[] {
    return this.list().filter((w) => w.enabled)
  }

  listByTrigger(triggerType: TriggerType): WorkflowDefinition[] {
    return this.listEnabled().filter((w) => w.trigger.type === triggerType)
  }

  search(query: string): WorkflowDefinition[] {
    const q = query.toLowerCase()
    return this.list().filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }

  setEnabled(id: WorkflowId, enabled: boolean): void {
    const wf = this.workflows.get(id)
    if (wf) {
      this.workflows.set(id, { ...wf, enabled, updatedAt: new Date().toISOString() })
    }
  }

  size(): number {
    return this.workflows.size
  }
}
