"use strict";
/**
 * MeetingPlatformProvider.ts — placeholder for meeting platform integrations.
 *
 * Would integrate with Zoom, Google Meet, Microsoft Teams, etc.
 * Not yet implemented.
 *
 * SAFETY: Stealth call joining is unconditionally blocked by MeetingSafetyGuard.
 * This provider, when implemented, must always surface a visible session indicator.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingPlatformProvider = void 0;
class MeetingPlatformProvider {
    constructor() {
        this.name = 'MeetingPlatform';
    }
    joinMeeting() {
        return {
            success: false,
            notImplemented: true,
            reason: 'Meeting platform integration (Zoom, Meet, Teams) is not yet implemented. See Phase 5.8 roadmap.',
        };
    }
    leaveMeeting() {
        return { success: false, notImplemented: true };
    }
    getStatus() {
        return { available: false, notImplemented: true };
    }
}
exports.MeetingPlatformProvider = MeetingPlatformProvider;
//# sourceMappingURL=MeetingPlatformProvider.js.map