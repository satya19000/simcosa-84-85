"use strict";
// ── Provider model ────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_TASK_TYPES = exports.AI_PROVIDER_IDS = void 0;
exports.AI_PROVIDER_IDS = ['claude', 'openai', 'gemini', 'openrouter', 'local'];
exports.MODEL_TASK_TYPES = [
    'chat', 'reasoning', 'summarization', 'tool_calling', 'code_generation',
    'classification', 'extraction', 'embedding', 'vision', 'audio',
    'lightweight', 'local', 'fallback',
];
//# sourceMappingURL=ModelTypes.js.map