import type { ComputerAuditEventType, ComputerCapabilityId } from './ComputerTypes'

export type ComputerEventName = ComputerAuditEventType

export interface ComputerEvent {
  name: ComputerEventName
  userId: string
  capabilityId?: ComputerCapabilityId
  payload: Record<string, unknown>
  emittedAt: string
}

type ComputerEventListener = (event: ComputerEvent) => void

/**
 * In-process event bus for computer-control events.
 * Mirrors SkillEvents's pattern.
 */
export class ComputerEvents {
  private readonly listeners = new Map<ComputerEventName, ComputerEventListener[]>()

  on(name: ComputerEventName, listener: ComputerEventListener): void {
    const existing = this.listeners.get(name) ?? []
    this.listeners.set(name, [...existing, listener])
  }

  emit(name: ComputerEventName, userId: string, capabilityId?: ComputerCapabilityId, payload: Record<string, unknown> = {}): void {
    const event: ComputerEvent = { name, userId, capabilityId, payload, emittedAt: new Date().toISOString() }
    const handlers = this.listeners.get(name) ?? []
    for (const handler of handlers) {
      try { handler(event) } catch { /* best-effort */ }
    }
  }
}
