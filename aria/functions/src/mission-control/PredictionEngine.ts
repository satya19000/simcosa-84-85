import type { Mission, MissionPrediction, MissionTask } from './MissionTypes'
import type { PredictionManager } from './PredictionManager'
import type { MissionManager } from './MissionManager'
import type { MissionTaskManager } from './MissionTaskManager'
import type { MissionConfig } from './MissionConfig'

/**
 * Heuristic, explainable predictions — NOT machine learning. Every value is
 * derived from a documented formula over the mission's own task data so the
 * `basis` string is always honest about what was actually computed.
 */
export class PredictionEngine {
  constructor(
    private readonly predictions: PredictionManager,
    private readonly missions: MissionManager,
    private readonly tasks: MissionTaskManager,
    private readonly config: MissionConfig
  ) {}

  /** Linear-rate ETA: days_elapsed / progress_fraction * (1 - progress_fraction), floored at 0. */
  async predictCompletionEta(userId: string, missionId: string): Promise<MissionPrediction | null> {
    const mission = await this.missions.getMission(userId, missionId)
    if (!mission) return null

    const createdMs = new Date(mission.createdAt).getTime()
    const nowMs = Date.now()
    const daysElapsed = Math.max(0.5, (nowMs - createdMs) / (24 * 60 * 60 * 1000))
    const progressFraction = mission.progress / 100

    let etaDays: number
    let confidence: number
    let basis: string

    if (progressFraction <= 0) {
      etaDays = mission.targetDate
        ? Math.max(0, (new Date(mission.targetDate).getTime() - nowMs) / (24 * 60 * 60 * 1000))
        : 30 // no signal at all — generic 30-day placeholder, low confidence
      confidence = mission.targetDate ? 0.3 : 0.1
      basis = mission.targetDate
        ? 'No progress yet; falling back to days until targetDate'
        : 'No progress and no targetDate; arbitrary 30-day placeholder'
    } else {
      const impliedTotalDays = daysElapsed / progressFraction
      etaDays = Math.max(0, impliedTotalDays - daysElapsed)
      confidence = Math.min(0.85, 0.3 + progressFraction * 0.5) // more progress observed -> more confidence
      basis = `Linear extrapolation: ${daysElapsed.toFixed(1)}d elapsed at ${mission.progress}% progress`
    }

    return this.predictions.record(userId, {
      userId,
      kind: 'mission_completion_eta',
      targetId: missionId,
      value: Math.round(etaDays * 10) / 10,
      confidence,
      basis,
    })
  }

  /** Risk that a mission with a targetDate will slip, based on progress vs. time-remaining ratio. */
  async predictTaskSlippageRisk(userId: string, missionId: string): Promise<MissionPrediction | null> {
    const mission = await this.missions.getMission(userId, missionId)
    if (!mission || !mission.targetDate) return null

    const tasksList = await this.tasks.listTasksForMission(userId, missionId)
    const total = tasksList.length
    const completed = tasksList.filter((t: MissionTask) => t.status === 'completed').length
    const blocked = tasksList.filter((t: MissionTask) => t.status === 'blocked').length

    const daysRemaining = (new Date(mission.targetDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    const completionFraction = total > 0 ? completed / total : mission.progress / 100

    let risk: number
    if (daysRemaining <= 0 && completionFraction < 1) {
      risk = 1
    } else if (daysRemaining <= this.config.atRiskWindowDays && completionFraction < 0.9) {
      risk = 0.7 + Math.min(0.3, blocked * 0.1)
    } else {
      risk = Math.max(0, (1 - completionFraction) * (daysRemaining < 14 ? 0.5 : 0.2))
    }
    risk = Math.min(1, risk)

    return this.predictions.record(userId, {
      userId,
      kind: 'task_slippage_risk',
      targetId: missionId,
      value: Math.round(risk * 100) / 100,
      confidence: total > 0 ? 0.6 : 0.35,
      basis: `${completed}/${total} tasks complete (${blocked} blocked), ${daysRemaining.toFixed(1)}d remaining to targetDate`,
    })
  }

  async refreshAll(userId: string, mission: Mission): Promise<MissionPrediction[]> {
    const results = await Promise.all([
      this.predictCompletionEta(userId, mission.id),
      mission.targetDate ? this.predictTaskSlippageRisk(userId, mission.id) : Promise.resolve(null),
    ])
    return results.filter((r): r is MissionPrediction => r !== null)
  }
}
