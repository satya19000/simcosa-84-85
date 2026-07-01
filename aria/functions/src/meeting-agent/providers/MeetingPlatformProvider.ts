/**
 * MeetingPlatformProvider.ts — placeholder for meeting platform integrations.
 *
 * Would integrate with Zoom, Google Meet, Microsoft Teams, etc.
 * Not yet implemented.
 *
 * SAFETY: Stealth call joining is unconditionally blocked by MeetingSafetyGuard.
 * This provider, when implemented, must always surface a visible session indicator.
 */

export class MeetingPlatformProvider {
  readonly name = 'MeetingPlatform'

  joinMeeting(): { success: false; notImplemented: true; reason: string } {
    return {
      success: false,
      notImplemented: true,
      reason: 'Meeting platform integration (Zoom, Meet, Teams) is not yet implemented. See Phase 5.8 roadmap.',
    }
  }

  leaveMeeting(): { success: false; notImplemented: true } {
    return { success: false, notImplemented: true }
  }

  getStatus(): { available: false; notImplemented: true } {
    return { available: false, notImplemented: true }
  }
}
