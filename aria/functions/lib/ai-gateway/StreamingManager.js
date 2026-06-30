"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingManager = void 0;
/**
 * Thin orchestration wrapper around ModelProvider.stream() that gives
 * AIGateway/Cloud Function call sites one place to add cross-cutting
 * concerns later (e.g. backpressure, max-duration cutoffs) without each
 * provider re-implementing them. Each provider remains responsible for the
 * actual streaming transport.
 */
class StreamingManager {
    async run(provider, prompt, options, onChunk) {
        return provider.stream(prompt, options, onChunk);
    }
}
exports.StreamingManager = StreamingManager;
//# sourceMappingURL=StreamingManager.js.map