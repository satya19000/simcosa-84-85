/** All events that ARIA and plugins can emit or subscribe to. */
export type ARIAEventName =
  | 'task:created'
  | 'task:completed'
  | 'task:deleted'
  | 'task:updated'
  | 'reminder:triggered'
  | 'reminder:created'
  | 'reminder:deleted'
  | 'contact:updated'
  | 'contact:created'
  | 'contact:deleted'
  | 'briefing:generated'
  | 'voice:started'
  | 'voice:stopped'
  | 'voice:transcribed'
  | 'chat:completed'
  | 'chat:started'
  | 'plugin:enabled'
  | 'plugin:disabled'
  | 'plugin:error'
  | 'note:created'
  | 'note:deleted'

export interface ARIAEvent<T = unknown> {
  name: ARIAEventName
  pluginId: string | 'core'
  userId?: string
  timestamp: string
  data: T
}

type EventHandler<T = unknown> = (event: ARIAEvent<T>) => void | Promise<void>

/**
 * Lightweight in-process event bus.
 * Plugins communicate through events; never through direct references.
 */
export class PluginEventBus {
  private handlers = new Map<ARIAEventName, Set<EventHandler>>()

  on<T = unknown>(eventName: ARIAEventName, handler: EventHandler<T>): () => void {
    const set = this.handlers.get(eventName) ?? new Set<EventHandler>()
    set.add(handler as EventHandler)
    this.handlers.set(eventName, set)
    // Return unsubscribe function
    return () => {
      this.handlers.get(eventName)?.delete(handler as EventHandler)
    }
  }

  async emit<T = unknown>(
    eventName: ARIAEventName,
    pluginId: string | 'core',
    data: T,
    userId?: string
  ): Promise<void> {
    const event: ARIAEvent<T> = {
      name: eventName,
      pluginId,
      userId,
      timestamp: new Date().toISOString(),
      data,
    }

    const handlers = this.handlers.get(eventName)
    if (!handlers || handlers.size === 0) return

    await Promise.allSettled(
      Array.from(handlers).map((handler) => handler(event as ARIAEvent))
    )
  }

  off(eventName: ARIAEventName, handler: EventHandler): void {
    this.handlers.get(eventName)?.delete(handler)
  }

  listSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [name, set] of this.handlers.entries()) {
      result[name] = set.size
    }
    return result
  }
}

/** Singleton event bus shared across the plugin runtime. */
export const pluginEventBus = new PluginEventBus()
