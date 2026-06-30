# AI Gateway (Phase 5.4) — Multi-LLM Gateway & Intelligent Model Routing

Provider-agnostic gateway so ARIA is not locked to a single LLM vendor.
Supports Claude, OpenAI, Gemini, OpenRouter, and a Local LLM **placeholder**,
with routing by task type, capability, cost, latency, privacy, provider
health, tenant policy, and user preference, plus automatic fallback.

## Honest-disclosure notice — what is real vs. placeholder

| Provider | Status |
|---|---|
| Claude (`ClaudeProvider`) | **Real.** Uses `@anthropic-ai/sdk`, same SDK as `chat.ts`. |
| OpenAI (`OpenAIProvider`) | **Real.** Plain REST against `api.openai.com`. Functional whenever `OPENAI_API_KEY` is set. |
| Gemini (`GeminiProvider`) | **Real.** Plain REST against `generativelanguage.googleapis.com`. Functional whenever `GEMINI_API_KEY` is set. |
| OpenRouter (`OpenRouterProvider`) | **Real.** Plain REST against `openrouter.ai`. Functional whenever `OPENROUTER_API_KEY` is set. |
| Local LLM (`LocalLLMProvider`) | **PLACEHOLDER ONLY — NOT FUNCTIONAL.** Structured stub: `healthCheck()` always reports unavailable, `complete()`/`stream()` always throw a clear "not implemented" error. `ModelCatalog`'s one local entry is marked `isPlaceholder: true` and `ModelRouter` filters it out of all routing decisions. See the file header in `providers/LocalLLMProvider.ts` for what real implementation would require. |
| Streaming for OpenAI/Gemini/OpenRouter | **Partial.** `stream()` on these three currently performs one `complete()` call and emits it as a single chunk rather than real SSE token streaming — documented in each provider, not hidden. Claude's `stream()` is real (uses the Anthropic SDK's streaming API). |
| Cost figures in `ModelCatalog.ts` | **Approximate, hand-curated.** Not a live pricing feed. Good enough for relative routing/cost-ceiling decisions, not for billing-grade accounting. |
| Token counts used for pre-flight cost estimates (`TokenEstimator`) | **Heuristic** (~4 chars/token), not a real tokenizer. Actual billed usage always comes from each provider's own response `usage` field. |

## Architecture

```
AIGateway (facade)
 ├─ ProviderRegistry      — composition root for all ModelProvider impls
 │   └─ providers/{Claude,OpenAI,Gemini,OpenRouter,LocalLLM}Provider
 ├─ ProviderHealthTracker — latency/failure-rate/circuit-breaker state, persisted
 ├─ ModelRouter           — scores catalog candidates, returns a RoutingDecision + fallbackChain
 ├─ ModelPolicyEngine     — tenant AI policy (allow/block providers, spend cap, privacy, local-only)
 ├─ ModelFallbackManager  — classifies failures, drives fallback attempts, never leaks raw errors
 ├─ ModelUsageTracker     — tenants/{tenantId}/aiUsage writes
 ├─ ModelBenchmark        — in-memory rolling latency/success-rate aggregator (inspection only)
 ├─ PromptNormalizer / ResponseNormalizer — ARIA-internal <-> provider-agnostic shape conversion
 └─ ModelPermissions      — adapter over the REAL RBACEngine (security.manage), never reimplemented
```

Every provider implements the `ModelProvider` interface
(`initialize`, `healthCheck`, `listModels`, `complete`, `stream`, optional
`embed`, `estimateCost`, `shutdown`). `ProviderRegistry` is the only place
that constructs provider instances; `ModelRouter`/`AIGateway` never import a
concrete provider class directly — adding a new provider means implementing
`ModelProvider` and registering it in `ProviderRegistry`, nothing else.

## Routing logic (`ModelRouter.route`)

1. Filter the static `ModelCatalog` to models whose `taskTypes` includes the
   requested task type, excluding placeholder models.
2. Filter by required capabilities, latency ceiling, and privacy level
   (`sensitive`/`restricted` privacy currently has no real candidate, since
   `LocalLLMProvider` is a placeholder — this **fails closed**, never
   silently relaxes to a cloud model).
3. For each remaining candidate: estimate cost via `ModelCostEstimator`,
   drop it if it exceeds `maxCostUsd`; check `ProviderHealthTracker`'s
   circuit-breaker state; check `ModelPolicyEngine.evaluate` (provider
   allow/block list, task-type restriction, privacy restriction, spend cap,
   `localOnlyMode`).
4. Score survivors: base = `qualityScore`; + bonus for matching
   `preferredProvider`/`preferredModel`; lightweight/classification tasks
   are biased toward cheap+fast models; reasoning/code tasks get a small
   bonus for large context windows.
5. Highest score wins; the rest become the `fallbackChain`.

## Fallback strategy

`AIGateway.complete()` attempts the routed model; on failure,
`ModelFallbackManager.classifyFailure` buckets the error into
`rate_limit | auth | timeout | server_error | invalid_request | unknown`.
`invalid_request` failures are not retried (the request itself is bad).
All other classes retry against the next non-placeholder model in the
`fallbackChain`, up to `AIGatewayConfig.fallbackMaxAttempts`. Every attempt
(success or failure) writes a usage record; every fallback transition writes
a `tenants/{tenantId}/aiFallbackEvents/{eventId}` record. If every attempt
fails, the caller receives `GatewayUserFacingError` — the raw provider error
is logged via `ModelTelemetry` but never returned to the client.

## Cost tracking & policy

Every request (success or failure) writes one
`tenants/{tenantId}/aiUsage/{usageId}` record (tokens in/out, estimated
cost, provider, model, task type, tenantId, userId, requestId, timestamp).
`ModelPolicyEngine` (`tenants/{tenantId}/aiPolicies/default`) lets tenant
admins set allowed/blocked providers, a max monthly spend (checked against
`ModelUsageTracker.getMonthToDateSpend`), allowed task types, a privacy
restriction, and `localOnlyMode` (placeholder — fails closed since no local
provider is functional). `AIGatewayConfig.hardMaxCostPerRequestUsd` is an
additional, simplistic last-resort ceiling independent of tenant policy.

## Chat integration

`chatWithAria` (in `chat.ts`) is **unchanged** in its default code path —
this module does not alter it. A new, parallel callable
`chatWithAriaGateway` (in `aiGatewayApi.ts`) demonstrates routing a chat
task through `AIGateway.complete()`, gated by
`AIGatewayConfig.enableAIGateway` (default `false`). Existing Action Engine
tool-calling via Claude is untouched — `chatWithAria` keeps calling the
Anthropic SDK directly exactly as before.

## Agent integration (forward-compatible only)

No existing agent has been rewritten. The exported `getAIGateway(userId, db,
apiKeys)` singleton getter (mirroring `getMarketplaceEngine` /
`getSecurityEngine`) is the intended call site for any agent that migrates
to gateway-routed completions in a future phase.

## Firestore schema

- `tenants/{tenantId}/aiUsage/{usageId}` — per-request usage/cost record.
- `tenants/{tenantId}/aiPolicies/{policyId}` — tenant AI policy (single `default` doc today).
- `tenants/{tenantId}/aiProviderHealth/{providerId}` — per-provider health/circuit-breaker state.
- `tenants/{tenantId}/aiFallbackEvents/{eventId}` — fallback transition log.
- `aiGateway/models/{modelId}`, `aiGateway/providers/{providerId}` — global catalog mirror (public read, CF-write), same pattern as `marketplace/items`.

All tenant-scoped paths are Cloud-Functions-only in `firestore.rules`
(deny-by-default), matching the `tenants/**` and Phase 5.3 marketplace
sections already in the rules file.

## Security/privacy safeguards

- No provider API key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
  `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) is ever sent to or readable by the
  frontend — they only exist as Cloud Functions secrets/env vars, read
  server-side in `aiGatewayApi.ts`.
- `ResponseNormalizer.finalize` strips the `raw` provider payload from every
  response unless `AIGatewayConfig.debugMode` is true.
- `ModelLogger`/`ModelTelemetry` log only metadata (provider, model,
  latency, tokens, cost, error class) — never full prompt/response text —
  unless an explicit debug call is made.
- `ModelFallbackManager.toUserFacingError()` is the only error type ever
  returned to a caller after a provider failure; raw provider error
  messages never leave the server.
