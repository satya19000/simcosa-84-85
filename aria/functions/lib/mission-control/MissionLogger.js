"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionLogger = void 0;
/** Thin structured-logging wrapper around MissionHistory, mirroring ApprovalLogger. */
class MissionLogger {
    constructor(history) {
        this.history = history;
    }
    async log(userId, entry) {
        await this.history.append(userId, entry);
    }
}
exports.MissionLogger = MissionLogger;
//# sourceMappingURL=MissionLogger.js.map