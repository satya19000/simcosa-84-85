import type { HealthEventName, HealthEvent } from './HealthTypes'

type EventHandler<T = unknown> = (event: HealthEvent<T>) => Promise<void> | void

class HealthEventBus {
  private readonly handlers = new Map<HealthEventName, EventHandler[]>()

  on<T>(event: HealthEventName, handler: EventHandler<T>): () => void {
    const list = this.handlers.get(event) ?? []
    list.push(handler as EventHandler)
    this.handlers.set(event, list)
    return () => {
      const updated = (this.handlers.get(event) ?? []).filter((h) => h !== handler)
      this.handlers.set(event, updated)
    }
  }

  async emit<T>(name: HealthEventName, userId: string, payload: T): Promise<void> {
    const event: HealthEvent<T> = { name, userId, payload, emittedAt: new Date().toISOString() }
    const handlers = this.handlers.get(name) ?? []
    await Promise.all(handlers.map((h) => h(event as HealthEvent)))
  }

  listSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [name, hs] of this.handlers) {
      result[name] = hs.length
    }
    return result
  }
}

export const HealthEvents = new HealthEventBus()
