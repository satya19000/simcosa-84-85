import type * as admin from 'firebase-admin'

/**
 * Immutable execution context threaded through every action.
 * Constructed once per Cloud Function invocation and never mutated.
 */
export interface ActionContext {
  /** Firebase UID of the authenticated caller. Always present — engine rejects unauthenticated requests before this is constructed. */
  readonly userId: string
  /** Display name from Firebase Auth, may be undefined. */
  readonly userDisplayName: string | undefined
  /** Firestore instance scoped to this invocation. */
  readonly db: admin.firestore.Firestore
  /** ISO-8601 timestamp captured at engine entry — used for all writes in this request so they share a consistent "now". */
  readonly requestTimestamp: string
  /** Monotonic start time for computing executionTimeMs. */
  readonly startHrTime: [number, number]
}

export function buildContext(
  userId: string,
  userDisplayName: string | undefined,
  db: admin.firestore.Firestore
): ActionContext {
  return {
    userId,
    userDisplayName,
    db,
    requestTimestamp: new Date().toISOString(),
    startHrTime: process.hrtime(),
  }
}

/** Returns elapsed milliseconds since context was created. */
export function elapsedMs(ctx: ActionContext): number {
  const [s, ns] = process.hrtime(ctx.startHrTime)
  return Math.round(s * 1000 + ns / 1_000_000)
}
