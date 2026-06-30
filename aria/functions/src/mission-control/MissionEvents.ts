import type { MissionEventName, MissionEvent } from './MissionTypes'

type EventHandler<T = unknown> = (event: MissionEvent<T>) => Promise<void> | void

class MissionEventBus {
  private readonly handlers = new Map<MissionEventName, EventHandler[]>()

  on<T>(event: MissionEventName, handler: EventHandler<T>): () => void {
    const list = this.handlers.get(event) ?? []
    list.push(handler as EventHandler)
    this.handlers.set(event, list)
    return () => {
      const updated = (this.handlers.get(event) ?? []).filter((h) => h !== handler)
      this.handlers.set(event, updated)
    }
  }

  async emit<T>(name: MissionEventName, userId: string, payload: T): Promise<void> {
    const event: MissionEvent<T> = { name, userId, payload, emittedAt: new Date().toISOString() }
    const handlers = this.handlers.get(name) ?? []
    await Promise.all(handlers.map((h) => h(event as MissionEvent)))
  }

  listSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [name, hs] of this.handlers) {
      result[name] = hs.length
    }
    return result
  }
}

export const MissionEvents = new MissionEventBus()
