"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
/**
 * Signals the client to speak a given text via TTS.
 * The actual TTS is handled by the client (BrowserSpeechProvider or similar).
 * This agent just outputs a structured speech signal.
 */
class VoiceAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'voice-agent',
            name: 'Voice Agent',
            description: 'Produces speech signals for client-side TTS playback',
            version: '1.0.0',
            capabilities: ['voice'],
        };
    }
    canHandle(task) {
        return task.capability === 'voice';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        const text = String(task.input['text'] ?? '');
        const lang = String(task.input['lang'] ?? 'en-US');
        if (!text) {
            return this.makeErrorResult(task, ctx, 'text is required for voice output', startMs);
        }
        // Output a speech signal consumed by the client
        return this.makeResult(task, ctx, { type: 'speech', text, lang }, `Voice signal: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`, startMs);
    }
}
exports.VoiceAgent = VoiceAgent;
//# sourceMappingURL=VoiceAgent.js.map