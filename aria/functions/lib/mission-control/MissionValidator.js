"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionValidator = exports.MissionValidationError = void 0;
class MissionValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MissionValidationError';
    }
}
exports.MissionValidationError = MissionValidationError;
const VALID_DOMAINS = ['finance', 'health', 'delegation', 'communication', 'general'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
/** Static input validators used by missionControlApi.ts before touching MissionEngine. Mirrors ApprovalValidator's shape but throws (callers wrap into HttpsError). */
class MissionValidator {
    static validateCreateMission(data) {
        if (!data || typeof data !== 'object')
            throw new MissionValidationError('Request body required');
        if (!data.title || !data.title.trim())
            throw new MissionValidationError('title is required');
        if (data.domain && !VALID_DOMAINS.includes(data.domain))
            throw new MissionValidationError(`domain must be one of ${VALID_DOMAINS.join(', ')}`);
        if (data.priority && !VALID_PRIORITIES.includes(data.priority))
            throw new MissionValidationError(`priority must be one of ${VALID_PRIORITIES.join(', ')}`);
        if (data.targetDate && isNaN(Date.parse(data.targetDate)))
            throw new MissionValidationError('targetDate must be a valid date');
    }
    static validateCreateTask(data) {
        if (!data || typeof data !== 'object')
            throw new MissionValidationError('Request body required');
        if (!data.missionId)
            throw new MissionValidationError('missionId is required');
        if (!data.title || !data.title.trim())
            throw new MissionValidationError('title is required');
        if (data.order !== undefined && (typeof data.order !== 'number' || data.order < 0))
            throw new MissionValidationError('order must be a non-negative number');
        if (data.dependsOn && !Array.isArray(data.dependsOn))
            throw new MissionValidationError('dependsOn must be an array of task ids');
    }
}
exports.MissionValidator = MissionValidator;
//# sourceMappingURL=MissionValidator.js.map