import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type {
  Patient, PatientDemographics, PatientVisit, PatientAllergy,
  PatientMedicalHistoryEntry, LabResult,
} from './HealthTypes'

const COL = (userId: string) => `users/${userId}/patients`

export class PatientManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async createPatient(userId: string, demographics: PatientDemographics, tags?: string[]): Promise<Patient> {
    const now = new Date().toISOString()
    const patient: Patient = {
      id: uuidv4(),
      userId,
      demographics,
      visits: [],
      allergies: [],
      medicalHistory: [],
      labResults: [],
      documentIds: [],
      tags,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(patient.id).set(patient)
    return patient
  }

  async getPatient(userId: string, patientId: string): Promise<Patient | null> {
    const snap = await this.db.collection(COL(userId)).doc(patientId).get()
    return snap.exists ? (snap.data() as Patient) : null
  }

  async updatePatient(userId: string, patientId: string, patch: Partial<Patient>): Promise<void> {
    await this.db.collection(COL(userId)).doc(patientId).update({
      ...patch,
      updatedAt: new Date().toISOString(),
    })
  }

  async deletePatient(userId: string, patientId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(patientId).delete()
  }

  async listPatients(userId: string, limit = 100): Promise<Patient[]> {
    const snap = await this.db.collection(COL(userId))
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as Patient)
  }

  async addVisit(userId: string, patientId: string, visit: Omit<PatientVisit, 'id'>): Promise<PatientVisit> {
    const patient = await this.getPatient(userId, patientId)
    if (!patient) throw new Error('Patient not found')
    const newVisit: PatientVisit = { id: uuidv4(), ...visit }
    patient.visits.push(newVisit)
    await this.updatePatient(userId, patientId, { visits: patient.visits })
    return newVisit
  }

  async addAllergy(userId: string, patientId: string, allergy: Omit<PatientAllergy, 'id'>): Promise<PatientAllergy> {
    const patient = await this.getPatient(userId, patientId)
    if (!patient) throw new Error('Patient not found')
    const newAllergy: PatientAllergy = { id: uuidv4(), ...allergy }
    patient.allergies.push(newAllergy)
    await this.updatePatient(userId, patientId, { allergies: patient.allergies })
    return newAllergy
  }

  async addMedicalHistory(userId: string, patientId: string, entry: Omit<PatientMedicalHistoryEntry, 'id'>): Promise<PatientMedicalHistoryEntry> {
    const patient = await this.getPatient(userId, patientId)
    if (!patient) throw new Error('Patient not found')
    const newEntry: PatientMedicalHistoryEntry = { id: uuidv4(), ...entry }
    patient.medicalHistory.push(newEntry)
    await this.updatePatient(userId, patientId, { medicalHistory: patient.medicalHistory })
    return newEntry
  }

  async addLabResult(userId: string, patientId: string, result: Omit<LabResult, 'id'>): Promise<LabResult> {
    const patient = await this.getPatient(userId, patientId)
    if (!patient) throw new Error('Patient not found')
    const newResult: LabResult = { id: uuidv4(), ...result }
    patient.labResults.push(newResult)
    await this.updatePatient(userId, patientId, { labResults: patient.labResults })
    return newResult
  }

  async linkDocument(userId: string, patientId: string, documentId: string): Promise<void> {
    const patient = await this.getPatient(userId, patientId)
    if (!patient) throw new Error('Patient not found')
    if (!patient.documentIds.includes(documentId)) {
      patient.documentIds.push(documentId)
      await this.updatePatient(userId, patientId, { documentIds: patient.documentIds })
    }
  }

  async setMemoryNodeId(userId: string, patientId: string, memoryNodeId: string): Promise<void> {
    await this.updatePatient(userId, patientId, { memoryNodeId })
  }
}
