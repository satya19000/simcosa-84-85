/**
 * MeetingSessionManager.ts — CRUD for meeting sessions in Firestore.
 */

import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { MeetingSession, MeetingType, MeetingStatus } from './MeetingTypes'
import type { MeetingConfig } from './MeetingConfig'

const SESSIONS_COL = (tenantId: string) => `tenants/${tenantId}/meetingSessions`

export class MeetingSessionManager {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly config: MeetingConfig
  ) {}

  async createSession(input: {
    userId: string
    tenantId: string
    title: string
    type: MeetingType
    language?: string
    location?: string
    platform?: string
    tags?: string[]
    notes?: string
    transcriptionEnabled?: boolean
    aiSummaryEnabled?: boolean
  }): Promise<MeetingSession> {
    const sessionId = uuidv4()
    const now = new Date().toISOString()
    const session: MeetingSession = {
      sessionId,
      userId: input.userId,
      tenantId: input.tenantId,
      title: input.title.trim(),
      type: input.type,
      participants: [],
      consentStatus: 'pending',
      status: 'consentRequired',
      recordingEnabled: this.config.recordingEnabledByDefault,
      transcriptionEnabled: input.transcriptionEnabled ?? true,
      aiSummaryEnabled: input.aiSummaryEnabled ?? this.config.aiSummaryEnabledByDefault,
      language: input.language,
      location: input.location,
      platform: input.platform,
      tags: input.tags ?? [],
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    }
    await this.db
      .collection(SESSIONS_COL(input.tenantId))
      .doc(sessionId)
      .set(session)
    return session
  }

  async getSession(tenantId: string, sessionId: string): Promise<MeetingSession | null> {
    const snap = await this.db
      .collection(SESSIONS_COL(tenantId))
      .doc(sessionId)
      .get()
    return snap.exists ? (snap.data() as MeetingSession) : null
  }

  async updateStatus(
    tenantId: string,
    sessionId: string,
    status: MeetingStatus,
    extra?: Partial<MeetingSession>
  ): Promise<void> {
    const now = new Date().toISOString()
    await this.db
      .collection(SESSIONS_COL(tenantId))
      .doc(sessionId)
      .update({ status, updatedAt: now, ...(extra ?? {}) })
  }

  async listSessions(
    tenantId: string,
    userId: string,
    limit = 50
  ): Promise<MeetingSession[]> {
    const snap = await this.db
      .collection(SESSIONS_COL(tenantId))
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as MeetingSession)
  }

  async deleteSession(tenantId: string, sessionId: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db
      .collection(SESSIONS_COL(tenantId))
      .doc(sessionId)
      .update({ status: 'deleted' as MeetingStatus, updatedAt: now })
  }
}
