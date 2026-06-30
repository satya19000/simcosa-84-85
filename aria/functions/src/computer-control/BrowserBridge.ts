import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from '../security/TenantEngine'
import type { BrowserExtensionRegistration } from './ComputerTypes'
import type { ComputerAudit } from './ComputerAudit'

const EXT_COL = (tenantId: string) => `tenants/${tenantId}/browserExtensions`

/**
 * BrowserBridge — Architecture/placeholder for the Browser Extension handshake.
 *
 * NOT IMPLEMENTED: No browser extension package is built, published,
 * or listed in any browser extension store.
 * All methods return placeholder registration records and are explicitly
 * documented as architecture stubs for future implementation.
 *
 * Future design:
 * - A browser extension (Chrome/Firefox/Safari) would be published.
 * - It would register here with an extensionId, browserName, and grantedCapabilities.
 * - It would send tab context, screenshots (after approval), and DOM state.
 * - All actions via the extension would still go through the approval bridge.
 *
 * Tenant membership is verified before every operation.
 */
export class BrowserBridge {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine,
    private readonly audit: ComputerAudit
  ) {}

  async registerBrowserExtension(
    tenantId: string,
    userId: string,
    input: {
      browserName: string
      version: string
      grantedCapabilities: BrowserExtensionRegistration['grantedCapabilities']
    }
  ): Promise<BrowserExtensionRegistration> {
    await this.tenants.requireIdentity(tenantId, userId)

    const extensionId = uuidv4()
    const now = new Date().toISOString()
    const registration: BrowserExtensionRegistration = {
      extensionId,
      userId,
      tenantId,
      browserName: input.browserName,
      version: input.version,
      grantedCapabilities: input.grantedCapabilities,
      activeTabAccess: false, // always false until extension is functional
      permissionStatus: 'pending',
      lastSeenAt: null,
      registeredAt: now,
      revokedAt: null,
      _placeholder: true,
    }

    await this.db.collection(EXT_COL(tenantId)).doc(extensionId).set(registration)

    await this.audit.record({
      tenantId,
      userId,
      eventType: 'extension.registered',
      extensionId,
      metadata: { browserName: input.browserName, version: input.version, placeholder: true },
    })

    return registration
  }

  async revokeBrowserExtension(tenantId: string, userId: string, extensionId: string): Promise<void> {
    await this.tenants.requireIdentity(tenantId, userId)
    const ref = this.db.collection(EXT_COL(tenantId)).doc(extensionId)
    await ref.update({ revokedAt: new Date().toISOString(), permissionStatus: 'revoked' })
    await this.audit.record({ tenantId, userId, eventType: 'extension.revoked', extensionId, metadata: {} })
  }

  async listBrowserExtensions(tenantId: string, userId: string): Promise<BrowserExtensionRegistration[]> {
    await this.tenants.requireIdentity(tenantId, userId)
    const snap = await this.db.collection(EXT_COL(tenantId)).where('userId', '==', userId).get()
    return snap.docs.map((d) => d.data() as BrowserExtensionRegistration)
  }

  async extensionHeartbeat(tenantId: string, userId: string, extensionId: string): Promise<BrowserExtensionRegistration | null> {
    await this.tenants.requireIdentity(tenantId, userId)
    const ref = this.db.collection(EXT_COL(tenantId)).doc(extensionId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ lastSeenAt: new Date().toISOString() })
    return (await ref.get()).data() as BrowserExtensionRegistration
  }
}
