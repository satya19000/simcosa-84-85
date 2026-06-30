import type { ApprovalEventName, ApprovalEvent } from './ApprovalTypes'

type EventHandler<T = unknown> = (event: ApprovalEvent<T>) => Promise<void> | void

class ApprovalEventBus {
  private readonly handlers = new Map<ApprovalEventName, EventHandler[]>()

  on<T>(event: ApprovalEventName, handler: EventHandler<T>): () => void {
    const list = this.handlers.get(event) ?? []
    list.push(handler as EventHandler)
    this.handlers.set(event, list)
    return () => {
      const updated = (this.handlers.get(event) ?? []).filter((h) => h !== handler)
      this.handlers.set(event, updated)
    }
  }

  async emit<T>(name: ApprovalEventName, userId: string, payload: T): Promise<void> {
    const event: ApprovalEvent<T> = { name, userId, payload, emittedAt: new Date().toISOString() }
    const handlers = this.handlers.get(name) ?? []
    await Promise.all(handlers.map((h) => h(event as ApprovalEvent)))
  }

  listSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [name, hs] of this.handlers) {
      result[name] = hs.length
    }
    return result
  }
}

export const ApprovalEvents = new ApprovalEventBus()
