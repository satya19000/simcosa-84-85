import type { NormalizedResponse } from './ModelTypes'

/**
 * Each ModelProvider already returns a NormalizedResponse directly (that
 * normalization happens inside the provider, since only the provider knows
 * its own wire format). This class is the second-stage, provider-agnostic
 * pass: it enforces the "raw only in debug mode" contract and strips
 * anything that shouldn't reach a non-debug caller, regardless of what an
 * individual provider implementation did or didn't do correctly.
 */
export class ResponseNormalizer {
  finalize(response: NormalizedResponse, debugMode: boolean): NormalizedResponse {
    if (debugMode) return response
    const { raw, ...rest } = response
    void raw
    return rest
  }
}
