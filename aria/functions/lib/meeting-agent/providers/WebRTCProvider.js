"use strict";
/**
 * WebRTCProvider.ts — placeholder for WebRTC-based audio capture.
 *
 * WebRTC requires browser APIs (RTCPeerConnection, getUserMedia).
 * Not implementable from a Cloud Functions backend.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRTCProvider = void 0;
class WebRTCProvider {
    constructor() {
        this.name = 'WebRTC';
    }
    connect() {
        return {
            success: false,
            notImplemented: true,
            reason: 'WebRTC requires browser APIs (RTCPeerConnection, getUserMedia). Not implementable from backend.',
        };
    }
    disconnect() {
        return { success: false, notImplemented: true };
    }
    getStatus() {
        return { available: false, notImplemented: true };
    }
}
exports.WebRTCProvider = WebRTCProvider;
//# sourceMappingURL=WebRTCProvider.js.map