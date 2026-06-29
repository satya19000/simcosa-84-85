import type * as admin from 'firebase-admin'

/**
 * Per-plugin configuration store.
 * Global settings live at: plugins/{pluginId}/config/settings
 * User settings live at: users/{userId}/plugins/{pluginId}/config
 */
export class PluginConfig {
  constructor(
    private readonly pluginId: string,
    private readonly db: admin.firestore.Firestore
  ) {}

  /** Load a user-scoped setting. Returns defaultValue if not set. */
  async get<T>(userId: string, key: string, defaultValue: T): Promise<T> {
    try {
      const snap = await this.db
        .collection('users')
        .doc(userId)
        .collection('plugins')
        .doc(this.pluginId)
        .collection('config')
        .doc('settings')
        .get()

      if (!snap.exists) return defaultValue
      const value = snap.data()?.[key]
      return value !== undefined ? (value as T) : defaultValue
    } catch {
      return defaultValue
    }
  }

  /** Save a user-scoped setting. */
  async set(userId: string, key: string, value: unknown): Promise<void> {
    await this.db
      .collection('users')
      .doc(userId)
      .collection('plugins')
      .doc(this.pluginId)
      .collection('config')
      .doc('settings')
      .set({ [key]: value }, { merge: true })
  }

  /** Load all user settings as a flat object. */
  async getAll(userId: string): Promise<Record<string, unknown>> {
    try {
      const snap = await this.db
        .collection('users')
        .doc(userId)
        .collection('plugins')
        .doc(this.pluginId)
        .collection('config')
        .doc('settings')
        .get()
      return snap.exists ? (snap.data() ?? {}) : {}
    } catch {
      return {}
    }
  }
}
