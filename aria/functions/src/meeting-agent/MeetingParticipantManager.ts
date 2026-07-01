/**
 * MeetingParticipantManager.ts — manages participants in a meeting session.
 */

import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { MeetingParticipant, ConsentStatus } from './MeetingTypes'

const PARTICIPANTS_COL = (tenantId: string) => `tenants/${tenantId}/meetingParticipants`

export class MeetingParticipantManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async addParticipant(input: {
    sessionId: string
    tenantId: string
    name: string
    email?: string
    phone?: string
    role?: string
    userId?: string
    consentStatus?: ConsentStatus
    consentNotes?: string
  }): Promise<MeetingParticipant> {
    const participantId = uuidv4()
    const now = new Date().toISOString()
    const participant: MeetingParticipant = {
      participantId,
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      userId: input.userId,
      name: input.name.trim(),
      email: input.email,
      phone: input.phone,
      role: input.role,
      consentStatus: input.consentStatus ?? 'pending',
      consentNotes: input.consentNotes,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    }
    await this.db
      .collection(PARTICIPANTS_COL(input.tenantId))
      .doc(participantId)
      .set(participant)
    return participant
  }

  async updateParticipantConsent(
    tenantId: string,
    participantId: string,
    consentStatus: ConsentStatus,
    notes?: string
  ): Promise<void> {
    const now = new Date().toISOString()
    await this.db
      .collection(PARTICIPANTS_COL(tenantId))
      .doc(participantId)
      .update({ consentStatus, consentNotes: notes, updatedAt: now })
  }

  async listParticipants(tenantId: string, sessionId: string): Promise<MeetingParticipant[]> {
    const snap = await this.db
      .collection(PARTICIPANTS_COL(tenantId))
      .where('sessionId', '==', sessionId)
      .get()
    return snap.docs.map((d) => d.data() as MeetingParticipant)
  }

  async markLeft(tenantId: string, participantId: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db
      .collection(PARTICIPANTS_COL(tenantId))
      .doc(participantId)
      .update({ leftAt: now, updatedAt: now })
  }
}
