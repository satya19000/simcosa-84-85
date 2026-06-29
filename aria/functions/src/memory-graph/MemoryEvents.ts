import type { MemoryEventName, MemoryEvent } from './MemoryTypes'

type EventHandler<T = unknown> = (event: MemoryEvent<T>) => Promise<void> | void

class MemoryEventBus {
  private readonly handlers = new Map<MemoryEventName, EventHandler[]>()

  on<T>(event: MemoryEventName, handler: EventHandler<T>): () => void {
    const list = this.handlers.get(event) ?? []
    list.push(handler as EventHandler)
    this.handlers.set(event, list)
    return () => {
      const updated = (this.handlers.get(event) ?? []).filter((h) => h !== handler)
      this.handlers.set(event, updated)
    }
  }

  async emit<T>(name: MemoryEventName, userId: string, payload: T): Promise<void> {
    const event: MemoryEvent<T> = { name, userId, payload, emittedAt: new Date().toISOString() }
    const handlers = this.handlers.get(name) ?? []
    await Promise.all(handlers.map((h) => h(event as MemoryEvent)))
  }

  listSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [name, handlers] of this.handlers) {
      result[name] = handlers.length
    }
    return result
  }
}

export const MemoryEvents = new MemoryEventBus()
