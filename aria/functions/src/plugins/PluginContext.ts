import type * as admin from 'firebase-admin'
import type { PluginEventBus } from './PluginEvents'
import type { PluginLogger } from './PluginLogger'
import type { PluginConfig } from './PluginConfig'
import type { PluginMetrics } from './PluginMetrics'
import type { CapabilityManager } from './CapabilityManager'

/**
 * Namespaced Firestore access for a plugin.
 * All reads/writes are scoped to: users/{userId}/plugins/{pluginId}/
 * Plugins MUST NOT call Firestore directly.
 */
export class PluginStorageService {
  private readonly basePath: string

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly userId: string,
    private readonly pluginId: string
  ) {
    this.basePath = `users/${userId}/plugins/${pluginId}`
  }

  collection(name: string): admin.firestore.CollectionReference {
    return this.db.doc(this.basePath).collection(name)
  }

  async get(collection: string, docId: string): Promise<admin.firestore.DocumentData | null> {
    const snap = await this.collection(collection).doc(docId).get()
    return snap.exists ? { id: snap.id, ...snap.data() } : null
  }

  async add(collection: string, data: Record<string, unknown>): Promise<string> {
    const ref = await this.collection(collection).add({
      ...data,
      _createdAt: new Date().toISOString(),
      _pluginId: this.pluginId,
      _userId: this.userId,
    })
    return ref.id
  }

  async set(collection: string, docId: string, data: Record<string, unknown>, merge = true): Promise<void> {
    await this.collection(collection).doc(docId).set(
      { ...data, _updatedAt: new Date().toISOString() },
      { merge }
    )
  }

  async delete(collection: string, docId: string): Promise<void> {
    await this.collection(collection).doc(docId).delete()
  }

  async list(
    collection: string,
    opts?: { orderBy?: string; limit?: number; where?: [string, admin.firestore.WhereFilterOp, unknown] }
  ): Promise<admin.firestore.DocumentData[]> {
    let q: admin.firestore.Query = this.collection(collection)
    if (opts?.where) q = q.where(opts.where[0], opts.where[1], opts.where[2])
    if (opts?.orderBy) q = q.orderBy(opts.orderBy, 'desc')
    if (opts?.limit) q = q.limit(opts.limit)
    const snap = await q.get()
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
}

/**
 * Everything a plugin receives per request.
 * Plugins access ARIA services through this — never through raw imports.
 */
export interface PluginContext {
  /** UID of the authenticated user making the current request. */
  userId: string
  /** Namespaced Firestore storage. No raw DB access. */
  storage: PluginStorageService
  /** Per-plugin structured logger. */
  logger: PluginLogger
  /** Typed event bus for publishing and subscribing to ARIA events. */
  events: PluginEventBus
  /** Plugin-scoped settings store. */
  config: PluginConfig
  /** Performance and health metrics. */
  metrics: PluginMetrics
  /** Capability checker — call requireCapability() before using any restricted feature. */
  capabilities: CapabilityManager
}

export function buildPluginContext(
  pluginId: string,
  userId: string,
  db: admin.firestore.Firestore,
  logger: PluginLogger,
  events: PluginEventBus,
  config: PluginConfig,
  metrics: PluginMetrics,
  capabilities: CapabilityManager
): PluginContext {
  return {
    userId,
    storage: new PluginStorageService(db, userId, pluginId),
    logger,
    events,
    config,
    metrics,
    capabilities,
  }
}
