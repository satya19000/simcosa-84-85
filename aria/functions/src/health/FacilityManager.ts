import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { HealthFacility, FacilityType, HealthcareProvider, ProviderRole } from './HealthTypes'

const FACILITIES_COL = (userId: string) => `users/${userId}/healthFacilities`
const PROVIDERS_COL = (userId: string) => `users/${userId}/healthcareProviders`

export class FacilityManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  // ── Facilities ────────────────────────────────────────────────────────────

  async createFacility(userId: string, fields: Omit<HealthFacility, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthFacility> {
    const now = new Date().toISOString()
    const facility: HealthFacility = { id: uuidv4(), userId, ...fields, createdAt: now, updatedAt: now }
    await this.db.collection(FACILITIES_COL(userId)).doc(facility.id).set(facility)
    return facility
  }

  async getFacility(userId: string, facilityId: string): Promise<HealthFacility | null> {
    const snap = await this.db.collection(FACILITIES_COL(userId)).doc(facilityId).get()
    return snap.exists ? (snap.data() as HealthFacility) : null
  }

  async updateFacility(userId: string, facilityId: string, patch: Partial<HealthFacility>): Promise<void> {
    await this.db.collection(FACILITIES_COL(userId)).doc(facilityId).update({
      ...patch,
      updatedAt: new Date().toISOString(),
    })
  }

  async deleteFacility(userId: string, facilityId: string): Promise<void> {
    await this.db.collection(FACILITIES_COL(userId)).doc(facilityId).delete()
  }

  async listFacilities(userId: string, type?: FacilityType): Promise<HealthFacility[]> {
    let query: admin.firestore.Query = this.db.collection(FACILITIES_COL(userId))
    if (type) query = query.where('type', '==', type)
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as HealthFacility)
  }

  async setMemoryNodeId(userId: string, facilityId: string, memoryNodeId: string): Promise<void> {
    await this.updateFacility(userId, facilityId, { memoryNodeId })
  }

  // ── Healthcare Providers (human: doctor/nurse/health worker) ────────────────

  async createProvider(userId: string, fields: Omit<HealthcareProvider, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthcareProvider> {
    const now = new Date().toISOString()
    const provider: HealthcareProvider = { id: uuidv4(), userId, ...fields, createdAt: now, updatedAt: now }
    await this.db.collection(PROVIDERS_COL(userId)).doc(provider.id).set(provider)
    return provider
  }

  async getProvider(userId: string, providerId: string): Promise<HealthcareProvider | null> {
    const snap = await this.db.collection(PROVIDERS_COL(userId)).doc(providerId).get()
    return snap.exists ? (snap.data() as HealthcareProvider) : null
  }

  async listProviders(userId: string, role?: ProviderRole): Promise<HealthcareProvider[]> {
    let query: admin.firestore.Query = this.db.collection(PROVIDERS_COL(userId))
    if (role) query = query.where('role', '==', role)
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as HealthcareProvider)
  }

  async deleteProvider(userId: string, providerId: string): Promise<void> {
    await this.db.collection(PROVIDERS_COL(userId)).doc(providerId).delete()
  }
}
