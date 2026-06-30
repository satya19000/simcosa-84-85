import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { Asset, AssetStatus, AssetAssignmentEntry } from './FinanceTypes'
import { FinanceEvents } from './FinanceEvents'

const COL = (userId: string) => `users/${userId}/assets`

export class AssetManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async registerAsset(
    userId: string,
    fields: Omit<Asset, 'id' | 'userId' | 'status' | 'assignmentHistory' | 'createdAt' | 'updatedAt'>
  ): Promise<Asset> {
    const now = new Date().toISOString()
    const asset: Asset = {
      id: uuidv4(),
      userId,
      status: 'active',
      assignmentHistory: [],
      ...fields,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(asset.id).set(asset)
    void FinanceEvents.emit('asset:registered', userId, { assetId: asset.id })
    return asset
  }

  async getAsset(userId: string, assetId: string): Promise<Asset | null> {
    const snap = await this.db.collection(COL(userId)).doc(assetId).get()
    return snap.exists ? (snap.data() as Asset) : null
  }

  async updateAsset(userId: string, assetId: string, patch: Partial<Asset>): Promise<void> {
    await this.db.collection(COL(userId)).doc(assetId).update({ ...patch, updatedAt: new Date().toISOString() })
  }

  async listAssets(userId: string, opts: { status?: AssetStatus; category?: string } = {}): Promise<Asset[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.status) query = query.where('status', '==', opts.status)
    if (opts.category) query = query.where('category', '==', opts.category)
    const snap = await query.orderBy('purchaseDate', 'desc').get()
    return snap.docs.map((d) => d.data() as Asset)
  }

  async setMemoryNodeId(userId: string, assetId: string, memoryNodeId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(assetId).update({ memoryNodeId })
  }

  async assignAsset(userId: string, assetId: string, assignedTo: string): Promise<Asset | null> {
    const asset = await this.getAsset(userId, assetId)
    if (!asset) return null
    const entry: AssetAssignmentEntry = { id: uuidv4(), assignedTo, assignedAt: new Date().toISOString() }
    const assignmentHistory = [...asset.assignmentHistory, entry]
    await this.updateAsset(userId, assetId, { assignmentHistory })
    return { ...asset, assignmentHistory, updatedAt: new Date().toISOString() }
  }

  async returnAsset(userId: string, assetId: string): Promise<Asset | null> {
    const asset = await this.getAsset(userId, assetId)
    if (!asset) return null
    const assignmentHistory = [...asset.assignmentHistory]
    for (let i = assignmentHistory.length - 1; i >= 0; i--) {
      if (!assignmentHistory[i].returnedAt) {
        assignmentHistory[i] = { ...assignmentHistory[i], returnedAt: new Date().toISOString() }
        break
      }
    }
    await this.updateAsset(userId, assetId, { assignmentHistory })
    return { ...asset, assignmentHistory, updatedAt: new Date().toISOString() }
  }

  async scheduleMaintenance(userId: string, assetId: string, date: string): Promise<Asset | null> {
    const asset = await this.getAsset(userId, assetId)
    if (!asset) return null
    const patch: Partial<Asset> = { nextMaintenanceAt: date }
    await this.updateAsset(userId, assetId, patch)
    return { ...asset, ...patch, updatedAt: new Date().toISOString() }
  }

  /** Scans for assets whose next maintenance date has arrived/passed; emits alerts. */
  async checkMaintenanceDue(userId: string): Promise<Asset[]> {
    const snap = await this.db.collection(COL(userId)).where('status', '==', 'active').get()
    const now = Date.now()
    const due: Asset[] = []
    for (const doc of snap.docs) {
      const asset = doc.data() as Asset
      if (asset.nextMaintenanceAt && Date.parse(asset.nextMaintenanceAt) <= now) {
        void FinanceEvents.emit('asset:maintenance_due', userId, { assetId: asset.id })
        due.push(asset)
      }
    }
    return due
  }

  async disposeAsset(userId: string, assetId: string, notes: string): Promise<Asset | null> {
    const asset = await this.getAsset(userId, assetId)
    if (!asset) return null
    const patch: Partial<Asset> = { status: 'disposed', disposedAt: new Date().toISOString(), disposalNotes: notes }
    await this.updateAsset(userId, assetId, patch)
    void FinanceEvents.emit('asset:disposed', userId, { assetId })
    return { ...asset, ...patch, updatedAt: new Date().toISOString() }
  }

  /**
   * Pluggable extension point: real depreciation methods (straight-line,
   * declining-balance, etc.) should be implemented by a plugin/program module.
   * This stub intentionally returns the purchase value unchanged.
   */
  computeDepreciationPlaceholder(asset: Asset): number {
    return asset.purchaseValue
  }
}
