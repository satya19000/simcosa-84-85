"use strict";
/**
 * StreamingSTTProvider.ts — placeholder for real-time streaming STT.
 *
 * This provider would integrate with a real-time STT service
 * (e.g., AssemblyAI, Deepgram, Google Speech-to-Text Streaming).
 * Not yet implemented.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingSTTProvider = void 0;
class StreamingSTTProvider {
    constructor() {
        this.name = 'StreamingSTT';
    }
    startStream() {
        return {
            success: false,
            notImplemented: true,
            reason: 'Real-time streaming STT requires integration with a service like AssemblyAI or Deepgram. ' +
                'Not yet implemented. See Phase 5.8 roadmap for streaming STT integration plan.',
        };
    }
    stopStream() {
        return { success: false, notImplemented: true, reason: 'StreamingSTTProvider is not implemented.' };
    }
    getStatus() {
        return { available: false, notImplemented: true };
    }
}
exports.StreamingSTTProvider = StreamingSTTProvider;
//# sourceMappingURL=StreamingSTTProvider.js.map