import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from './TenantEngine'
import type { SessionRecord } from './SecurityTypes'

const SESSIONS_COL = (tenantId: string) => `tenants/${tenantId}/sessions`

/**
 * Repository for tenants/{tenantId}/sessions/{sessionId}.
 *
 * IMPORTANT — `ipAddress` and `location` are PLACEHOLDER fields only. This
 * module does not perform real IP geolocation or device fingerprinting; the
 * fields exist so a future phase can wire in real values without a schema
 * migration. Treat any non-null value here as caller-supplied metadata, not
 * a verified network fact.
 */
export class SessionManager {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine
  ) {}

  async createSession(
    tenantId: string,
    userId: string,
    input: { identityId: string; deviceInfo?: string | null; browser?: string | null; ipAddress?: string | null; location?: string | null }
  ): Promise<SessionRecord> {
    await this.tenants.requireIdentity(tenantId, userId)
    const sessionId = uuidv4()
    const now = new Date().toISOString()
    const record: SessionRecord = {
      id: sessionId,
      tenantId,
      sessionId,
      identityId: input.identityId,
      userId,
      loginAt: now,
      lastActiveAt: now,
      deviceInfo: input.deviceInfo ?? null,
      browser: input.browser ?? null,
      ipAddress: input.ipAddress ?? null, // placeholder, see class doc
      location: input.location ?? null, // placeholder, see class doc
      active: true,
      revokedAt: null,
      createdAt: now,
    }
    await this.db.collection(SESSIONS_COL(tenantId)).doc(sessionId).set(record)
    return record
  }

  async refreshSession(tenantId: string, userId: string, sessionId: string): Promise<SessionRecord | null> {
    await this.tenants.requireIdentity(tenantId, userId)
    const ref = this.db.collection(SESSIONS_COL(tenantId)).doc(sessionId)
    const snap = await ref.get()
    if (!snap.exists) return null
    const session = snap.data() as SessionRecord
    if (!session.active) return session
    await ref.update({ lastActiveAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as SessionRecord
  }

  async revokeSession(tenantId: string, userId: string, sessionId: string): Promise<SessionRecord | null> {
    await this.tenants.requireIdentity(tenantId, userId)
    const ref = this.db.collection(SESSIONS_COL(tenantId)).doc(sessionId)
    const snap = await ref.get()
    if (!snap.exists) return null
    const now = new Date().toISOString()
    await ref.update({ active: false, revokedAt: now })
    const updated = await ref.get()
    return updated.data() as SessionRecord
  }

  async listSessions(tenantId: string, userId: string, forUserId?: string): Promise<SessionRecord[]> {
    await this.tenants.requireIdentity(tenantId, userId)
    let query = this.db.collection(SESSIONS_COL(tenantId)) as admin.firestore.Query
    if (forUserId) query = query.where('userId', '==', forUserId)
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as SessionRecord)
  }
}
