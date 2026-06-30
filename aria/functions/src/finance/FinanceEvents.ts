import type { FinanceEventName, FinanceEvent } from './FinanceTypes'

type EventHandler<T = unknown> = (event: FinanceEvent<T>) => Promise<void> | void

class FinanceEventBus {
  private readonly handlers = new Map<FinanceEventName, EventHandler[]>()

  on<T>(event: FinanceEventName, handler: EventHandler<T>): () => void {
    const list = this.handlers.get(event) ?? []
    list.push(handler as EventHandler)
    this.handlers.set(event, list)
    return () => {
      const updated = (this.handlers.get(event) ?? []).filter((h) => h !== handler)
      this.handlers.set(event, updated)
    }
  }

  async emit<T>(name: FinanceEventName, userId: string, payload: T): Promise<void> {
    const event: FinanceEvent<T> = { name, userId, payload, emittedAt: new Date().toISOString() }
    const handlers = this.handlers.get(name) ?? []
    await Promise.all(handlers.map((h) => h(event as FinanceEvent)))
  }

  listSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [name, hs] of this.handlers) {
      result[name] = hs.length
    }
    return result
  }
}

export const FinanceEvents = new FinanceEventBus()
