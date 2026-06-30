import type { MissionHistory } from './MissionHistory'

/** Thin structured-logging wrapper around MissionHistory, mirroring ApprovalLogger. */
export class MissionLogger {
  constructor(private readonly history: MissionHistory) {}

  async log(userId: string, entry: { requestId: string; actor: string; action: string; notes?: string; details?: Record<string, unknown> }): Promise<void> {
    await this.history.append(userId, entry)
  }
}
