/**
 * PhoneProvider.ts — placeholder for phone/PSTN call integration.
 *
 * Would integrate with a telephony provider (e.g., Twilio, Vonage).
 * Not yet implemented.
 */

export class PhoneProvider {
  readonly name = 'Phone'

  initiateCall(): { success: false; notImplemented: true; reason: string } {
    return {
      success: false,
      notImplemented: true,
      reason: 'Phone/PSTN integration requires a telephony provider (e.g., Twilio). Not yet implemented.',
    }
  }

  endCall(): { success: false; notImplemented: true } {
    return { success: false, notImplemented: true }
  }

  getStatus(): { available: false; notImplemented: true } {
    return { available: false, notImplemented: true }
  }
}
