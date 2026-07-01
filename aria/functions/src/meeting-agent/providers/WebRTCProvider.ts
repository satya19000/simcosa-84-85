/**
 * WebRTCProvider.ts — placeholder for WebRTC-based audio capture.
 *
 * WebRTC requires browser APIs (RTCPeerConnection, getUserMedia).
 * Not implementable from a Cloud Functions backend.
 */

export class WebRTCProvider {
  readonly name = 'WebRTC'

  connect(): { success: false; notImplemented: true; reason: string } {
    return {
      success: false,
      notImplemented: true,
      reason: 'WebRTC requires browser APIs (RTCPeerConnection, getUserMedia). Not implementable from backend.',
    }
  }

  disconnect(): { success: false; notImplemented: true } {
    return { success: false, notImplemented: true }
  }

  getStatus(): { available: false; notImplemented: true } {
    return { available: false, notImplemented: true }
  }
}
