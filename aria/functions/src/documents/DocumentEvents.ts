import type { DocumentEventName, DocumentEvent } from './DocumentTypes'

type EventHandler<T = unknown> = (event: DocumentEvent<T>) => Promise<void> | void

class DocumentEventBus {
  private readonly handlers = new Map<DocumentEventName, EventHandler[]>()

  on<T>(event: DocumentEventName, handler: EventHandler<T>): () => void {
    const list = this.handlers.get(event) ?? []
    list.push(handler as EventHandler)
    this.handlers.set(event, list)
    return () => {
      const updated = (this.handlers.get(event) ?? []).filter((h) => h !== handler)
      this.handlers.set(event, updated)
    }
  }

  async emit<T>(name: DocumentEventName, documentId: string, userId: string, payload: T): Promise<void> {
    const event: DocumentEvent<T> = { name, documentId, userId, payload, emittedAt: new Date().toISOString() }
    const handlers = this.handlers.get(name) ?? []
    await Promise.all(handlers.map((h) => h(event as DocumentEvent)))
  }

  listSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [name, handlers] of this.handlers) {
      result[name] = handlers.length
    }
    return result
  }
}

export const DocumentEvents = new DocumentEventBus()
