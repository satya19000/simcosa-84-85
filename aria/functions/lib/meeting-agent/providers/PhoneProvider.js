"use strict";
/**
 * PhoneProvider.ts — placeholder for phone/PSTN call integration.
 *
 * Would integrate with a telephony provider (e.g., Twilio, Vonage).
 * Not yet implemented.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneProvider = void 0;
class PhoneProvider {
    constructor() {
        this.name = 'Phone';
    }
    initiateCall() {
        return {
            success: false,
            notImplemented: true,
            reason: 'Phone/PSTN integration requires a telephony provider (e.g., Twilio). Not yet implemented.',
        };
    }
    endCall() {
        return { success: false, notImplemented: true };
    }
    getStatus() {
        return { available: false, notImplemented: true };
    }
}
exports.PhoneProvider = PhoneProvider;
//# sourceMappingURL=PhoneProvider.js.map