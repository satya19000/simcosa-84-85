import type { MissionManager } from './MissionManager'
import type { Mission, MissionDomain, MissionStatus, MissionStats } from './MissionTypes'

const ALL_STATUSES: MissionStatus[] = ['draft', 'active', 'paused', 'completed', 'abandoned']
const ALL_DOMAINS: MissionDomain[] = ['finance', 'health', 'delegation', 'communication', 'general']

export class MissionAnalytics {
  constructor(private readonly missions: MissionManager) {}

  async getStats(userId: string): Promise<MissionStats> {
    const all = await this.missions.listMissions(userId)
    const byStatus = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<MissionStatus, number>
    const byDomain = Object.fromEntries(ALL_DOMAINS.map((d) => [d, 0])) as Record<MissionDomain, number>

    let progressSum = 0
    let completedThisMonth = 0
    let overdue = 0
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    for (const m of all) {
      byStatus[m.status]++
      byDomain[m.domain]++
      progressSum += m.progress
      if (m.status === 'completed' && m.completedAt && m.completedAt >= monthStart) completedThisMonth++
      if (m.targetDate && m.status !== 'completed' && m.status !== 'abandoned' && m.targetDate < now.toISOString()) overdue++
    }

    return {
      totalMissions: all.length,
      byStatus,
      byDomain,
      avgProgress: all.length ? Math.round(progressSum / all.length) : 0,
      completedThisMonth,
      overdue,
    }
  }

  /** Helper used by PredictionEngine: missions with a targetDate within `windowDays` that aren't done. */
  async listAtRiskMissions(userId: string, windowDays: number): Promise<Mission[]> {
    const all = await this.missions.listMissions(userId, { status: 'active' })
    const cutoff = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000).toISOString()
    return all.filter((m) => m.targetDate && m.targetDate <= cutoff && m.progress < 100)
  }
}
