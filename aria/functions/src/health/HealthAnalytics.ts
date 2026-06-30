import type * as admin from 'firebase-admin'
import type { HealthStats, Medication, FacilityType } from './HealthTypes'

const PATIENTS_COL = (userId: string) => `users/${userId}/patients`
const APPOINTMENTS_COL = (userId: string) => `users/${userId}/healthAppointments`
const MEDICATIONS_COL = (userId: string) => `users/${userId}/medications`
const VACCINATIONS_COL = (userId: string) => `users/${userId}/vaccinations`
const FACILITIES_COL = (userId: string) => `users/${userId}/healthFacilities`

export class HealthAnalytics {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async getStats(userId: string): Promise<HealthStats> {
    const [patientsSnap, apptsSnap, medsSnap, vacsSnap, facilitiesSnap] = await Promise.all([
      this.db.collection(PATIENTS_COL(userId)).get(),
      this.db.collection(APPOINTMENTS_COL(userId)).get(),
      this.db.collection(MEDICATIONS_COL(userId)).get(),
      this.db.collection(VACCINATIONS_COL(userId)).get(),
      this.db.collection(FACILITIES_COL(userId)).get(),
    ])

    const now = Date.now()
    const appointments = apptsSnap.docs.map((d) => d.data() as { status: string; scheduledFor: string })
    const upcomingAppointments = appointments.filter(
      (a) => a.status === 'scheduled' && new Date(a.scheduledFor).getTime() > now
    ).length
    const pendingFollowUps = appointments.filter((a) => a.status === 'missed').length

    const medications = medsSnap.docs.map((d) => d.data() as Medication)
    const adherenceRates = medications.map((m) => {
      const tracked = m.doses.filter((d) => d.status !== 'pending')
      if (tracked.length === 0) return null
      return tracked.filter((d) => d.status === 'taken').length / tracked.length
    }).filter((r): r is number => r !== null)
    const medicationAdherenceRate = adherenceRates.length > 0
      ? adherenceRates.reduce((a, b) => a + b, 0) / adherenceRates.length
      : 1

    const vaccinations = vacsSnap.docs.map((d) => d.data() as { status: string })
    const vaccinationCoverage = vaccinations.length > 0
      ? vaccinations.filter((v) => v.status === 'completed').length / vaccinations.length
      : 0

    const facilities = facilitiesSnap.docs.map((d) => d.data() as { type: FacilityType })
    const byFacilityType: Record<string, number> = {}
    for (const f of facilities) byFacilityType[f.type] = (byFacilityType[f.type] ?? 0) + 1

    return {
      totalPatients: patientsSnap.size,
      totalAppointments: apptsSnap.size,
      upcomingAppointments,
      medicationAdherenceRate,
      vaccinationCoverage,
      pendingFollowUps,
      facilitiesCount: facilitiesSnap.size,
      byFacilityType,
    }
  }

  async getProgramCoverage(userId: string, programDiseaseIds: string[]): Promise<{ programCount: number; affectedPatients: number }> {
    if (programDiseaseIds.length === 0) return { programCount: 0, affectedPatients: 0 }
    const snap = await this.db.collection(PATIENTS_COL(userId)).get()
    let affected = 0
    for (const doc of snap.docs) {
      const patient = doc.data() as { medicalHistory?: Array<{ condition: string }> }
      const hasCondition = (patient.medicalHistory ?? []).some((h) => programDiseaseIds.includes(h.condition))
      if (hasCondition) affected++
    }
    return { programCount: programDiseaseIds.length, affectedPatients: affected }
  }
}
