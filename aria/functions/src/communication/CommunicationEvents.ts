import type { CommunicationEventName, CommunicationEvent } from './CommunicationTypes'

type EventHandler<T = unknown> = (event: CommunicationEvent<T>) => Promise<void> | void

class CommunicationEventBus {
  private readonly handlers = new Map<CommunicationEventName, EventHandler[]>()

  on<T>(event: CommunicationEventName, handler: EventHandler<T>): () => void {
    const list = this.handlers.get(event) ?? []
    list.push(handler as EventHandler)
    this.handlers.set(event, list)
    return () => {
      const updated = (this.handlers.get(event) ?? []).filter((h) => h !== handler)
      this.handlers.set(event, updated)
    }
  }

  async emit<T>(name: CommunicationEventName, userId: string, payload: T): Promise<void> {
    const event: CommunicationEvent<T> = { name, userId, payload, emittedAt: new Date().toISOString() }
    const handlers = this.handlers.get(name) ?? []
    await Promise.all(handlers.map((h) => h(event as CommunicationEvent)))
  }

  listSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [name, hs] of this.handlers) {
      result[name] = hs.length
    }
    return result
  }
}

export const CommunicationEvents = new CommunicationEventBus()
