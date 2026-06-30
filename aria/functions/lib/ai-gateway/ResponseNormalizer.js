"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseNormalizer = void 0;
/**
 * Each ModelProvider already returns a NormalizedResponse directly (that
 * normalization happens inside the provider, since only the provider knows
 * its own wire format). This class is the second-stage, provider-agnostic
 * pass: it enforces the "raw only in debug mode" contract and strips
 * anything that shouldn't reach a non-debug caller, regardless of what an
 * individual provider implementation did or didn't do correctly.
 */
class ResponseNormalizer {
    finalize(response, debugMode) {
        if (debugMode)
            return response;
        const { raw, ...rest } = response;
        void raw;
        return rest;
    }
}
exports.ResponseNormalizer = ResponseNormalizer;
//# sourceMappingURL=ResponseNormalizer.js.map