import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { DiseaseInfo, HealthProgram } from './HealthTypes'

const DISEASES_COL = (userId: string) => `users/${userId}/diseaseKnowledge`
const PROGRAMS_COL = (userId: string) => `users/${userId}/healthPrograms`

// ── Disease & Program Knowledge Store ────────────────────────────────────────
// Provider-independent. Public-health plugins (Maternal Health, TB, HIV, NCD,
// Immunization, etc) register diseases/protocols/programs here without the
// core engine depending on any specific program.

export class DiseaseKnowledge {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async registerDisease(userId: string, fields: Omit<DiseaseInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiseaseInfo> {
    const now = new Date().toISOString()
    const disease: DiseaseInfo = { id: uuidv4(), ...fields, createdAt: now, updatedAt: now }
    await this.db.collection(DISEASES_COL(userId)).doc(disease.id).set(disease)
    return disease
  }

  async getDisease(userId: string, diseaseId: string): Promise<DiseaseInfo | null> {
    const snap = await this.db.collection(DISEASES_COL(userId)).doc(diseaseId).get()
    return snap.exists ? (snap.data() as DiseaseInfo) : null
  }

  async updateDisease(userId: string, diseaseId: string, patch: Partial<DiseaseInfo>): Promise<void> {
    await this.db.collection(DISEASES_COL(userId)).doc(diseaseId).update({
      ...patch,
      updatedAt: new Date().toISOString(),
    })
  }

  async listDiseases(userId: string, programId?: string): Promise<DiseaseInfo[]> {
    let query: admin.firestore.Query = this.db.collection(DISEASES_COL(userId))
    if (programId) query = query.where('programId', '==', programId)
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as DiseaseInfo)
  }

  async searchDiseases(userId: string, queryText: string): Promise<DiseaseInfo[]> {
    const all = await this.listDiseases(userId)
    const lower = queryText.toLowerCase()
    return all.filter((d) =>
      d.name.toLowerCase().includes(lower) ||
      d.symptoms.some((s) => s.toLowerCase().includes(lower))
    )
  }

  // ── Programs ──────────────────────────────────────────────────────────────

  async registerProgram(userId: string, program: HealthProgram): Promise<void> {
    await this.db.collection(PROGRAMS_COL(userId)).doc(program.id).set(program)
  }

  async listPrograms(userId: string): Promise<HealthProgram[]> {
    const snap = await this.db.collection(PROGRAMS_COL(userId)).get()
    return snap.docs.map((d) => d.data() as HealthProgram)
  }

  async getProgram(userId: string, programId: string): Promise<HealthProgram | null> {
    const snap = await this.db.collection(PROGRAMS_COL(userId)).doc(programId).get()
    return snap.exists ? (snap.data() as HealthProgram) : null
  }
}
