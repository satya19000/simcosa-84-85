/**
 * StreamingSTTProvider.ts — placeholder for real-time streaming STT.
 *
 * This provider would integrate with a real-time STT service
 * (e.g., AssemblyAI, Deepgram, Google Speech-to-Text Streaming).
 * Not yet implemented.
 */

export class StreamingSTTProvider {
  readonly name = 'StreamingSTT'

  startStream(): { success: false; notImplemented: true; reason: string } {
    return {
      success: false,
      notImplemented: true,
      reason:
        'Real-time streaming STT requires integration with a service like AssemblyAI or Deepgram. ' +
        'Not yet implemented. See Phase 5.8 roadmap for streaming STT integration plan.',
    }
  }

  stopStream(): { success: false; notImplemented: true; reason: string } {
    return { success: false, notImplemented: true, reason: 'StreamingSTTProvider is not implemented.' }
  }

  getStatus(): { available: false; notImplemented: true } {
    return { available: false, notImplemented: true }
  }
}
