import { MarketplaceLogger } from './MarketplaceLogger'

/** Closed vocabulary of marketplace lifecycle events. */
export type SkillEventName =
  | 'skill:created' | 'skill:submitted' | 'skill:approved' | 'skill:rejected'
  | 'skill:published' | 'skill:deprecated' | 'skill:installed' | 'skill:install_pending_approval'
  | 'skill:uninstalled' | 'skill:enabled' | 'skill:disabled'
  | 'skill:permission_granted' | 'skill:permission_revoked' | 'skill:reviewed'

export interface SkillEvent<T = unknown> {
  name: SkillEventName
  itemId: string | null
  installationId: string | null
  actorId: string
  payload: T
  emittedAt: string
}

/**
 * Typed structured event log helper for marketplace lifecycle events.
 * This is a lightweight, logger-backed emit() — not a real pub/sub broker.
 * Consistent in style with MarketplaceLogger; consumers (e.g. a future
 * notifications/analytics subscriber) can be wired in later without
 * changing this contract.
 */
export class SkillEvents {
  private readonly logger = new MarketplaceLogger()

  emit<T = unknown>(name: SkillEventName, actorId: string, itemId: string | null, installationId: string | null, payload: T): SkillEvent<T> {
    const event: SkillEvent<T> = {
      name,
      itemId,
      installationId,
      actorId,
      payload,
      emittedAt: new Date().toISOString(),
    }
    this.logger.info('events', name, { itemId, installationId, actorId, payload })
    return event
  }
}
