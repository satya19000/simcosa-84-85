import { EventEmitter } from 'events'
import type { ActivityEventType } from './WorkspaceTypes'

export interface WorkspaceEventPayload {
  organizationId: string
  type: ActivityEventType
  actorId: string
  [key: string]: unknown
}

/** Lightweight in-process event bus — mirrors ApprovalEvents.ts. Best-effort, in-memory only (no cross-instance fan-out). */
export class WorkspaceEvents {
  private static emitter = new EventEmitter()

  static emit(eventName: ActivityEventType, payload: WorkspaceEventPayload): void {
    WorkspaceEvents.emitter.emit(eventName, payload)
    WorkspaceEvents.emitter.emit('*', payload)
  }

  static on(eventName: ActivityEventType | '*', listener: (payload: WorkspaceEventPayload) => void): void {
    WorkspaceEvents.emitter.on(eventName, listener)
  }

  static off(eventName: ActivityEventType | '*', listener: (payload: WorkspaceEventPayload) => void): void {
    WorkspaceEvents.emitter.off(eventName, listener)
  }
}
