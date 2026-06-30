import type { MissionDomain, MissionPriority } from './MissionTypes'

export class MissionValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissionValidationError'
  }
}

const VALID_DOMAINS: MissionDomain[] = ['finance', 'health', 'delegation', 'communication', 'general']
const VALID_PRIORITIES: MissionPriority[] = ['low', 'medium', 'high', 'critical']

/** Static input validators used by missionControlApi.ts before touching MissionEngine. Mirrors ApprovalValidator's shape but throws (callers wrap into HttpsError). */
export class MissionValidator {
  static validateCreateMission(data: { title?: string; description?: string; domain?: MissionDomain; priority?: MissionPriority; targetDate?: string }): void {
    if (!data || typeof data !== 'object') throw new MissionValidationError('Request body required')
    if (!data.title || !data.title.trim()) throw new MissionValidationError('title is required')
    if (data.domain && !VALID_DOMAINS.includes(data.domain)) throw new MissionValidationError(`domain must be one of ${VALID_DOMAINS.join(', ')}`)
    if (data.priority && !VALID_PRIORITIES.includes(data.priority)) throw new MissionValidationError(`priority must be one of ${VALID_PRIORITIES.join(', ')}`)
    if (data.targetDate && isNaN(Date.parse(data.targetDate))) throw new MissionValidationError('targetDate must be a valid date')
  }

  static validateCreateTask(data: { missionId?: string; title?: string; order?: number; dependsOn?: string[] }): void {
    if (!data || typeof data !== 'object') throw new MissionValidationError('Request body required')
    if (!data.missionId) throw new MissionValidationError('missionId is required')
    if (!data.title || !data.title.trim()) throw new MissionValidationError('title is required')
    if (data.order !== undefined && (typeof data.order !== 'number' || data.order < 0)) throw new MissionValidationError('order must be a non-negative number')
    if (data.dependsOn && !Array.isArray(data.dependsOn)) throw new MissionValidationError('dependsOn must be an array of task ids')
  }
}
