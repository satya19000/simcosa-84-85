# Speech-to-text and LLM providers

Both are behind adapters (`server/src/providers/stt`, `server/src/providers/llm`) chosen with
`STT_PROVIDER` and `LLM_PROVIDER`. `mock` providers make the full flow work offline for development.

## What was checked (November 2026), and how far

From this build environment, `docs.sarvam.ai` was not reachable, so the Sarvam details below come
from search results and secondary sources, not the official page. Re-check every item marked
**verify** against the official docs and your account's console before going live.

### Sarvam AI — `STT_PROVIDER=sarvam` (suggested default for Telugu–English)

- Sarvam's changelog says the speech-to-text REST and Batch endpoints now default to `saaras:v3`
  (previously `saarika:v2.5`), and its Telugu page says Saaras v3 handles Telugu–English
  code-switching.
- The synchronous REST endpoint accepts short clips only (about 30 s). The adapter therefore cuts
  each window into ≤ 29 s pieces at pauses and sends 4 at a time.
- **Verify:** request field names (`file`, `model`, `language_code`), the `"unknown"` auto-detect
  language code, response field `transcript`, and rate limits.
- **No speaker labels** from the synchronous endpoint. Sarvam's batch API offers diarization for long
  audio; moving the adapter to it is the main improvement to make once you have access.
- Pricing: secondary sources quote around ₹30 per audio hour (about ₹45 with diarization) with
  starter credits. Confirm on dashboard.sarvam.ai/pricing.

### Google Cloud Speech-to-Text v2, Chirp 3 — `STT_PROVIDER=google`

- Google's Chirp 3 page lists Telugu (`te-IN`) for `BatchRecognize` (some localised pages mark it
  Preview). BatchRecognize reads from Cloud Storage, so the adapter passes the window's `gs://` URI
  in the Firebase bucket directly. Each file can be up to 8 hours.
- Diarization for Chirp 3 was limited to a short language list that did not include Telugu.
- Mixed meetings use the `auto` language code. **Verify** that `auto` works for your region and
  model, and that the region (`GOOGLE_STT_LOCATION`, default `asia-south1`) hosts Chirp 3.
  Otherwise use the `us`/`eu` multi-region (data then leaves India).
- Needs the Speech-to-Text API enabled and `roles/speech.client` on the worker service account.

### Anthropic Claude — `LLM_PROVIDER=anthropic`

- Model `claude-opus-5-5` (configurable with `ANTHROPIC_MODEL`), $4 / $20 per million input/output
  tokens at the time of writing. A 2-hour meeting is roughly 30–80k input tokens depending on how
  much Telugu is spoken, so minutes typically cost well under a dollar. Check current pricing.
- Uses the official `@anthropic-ai/sdk`, streaming, adaptive thinking, `effort` (default `high`),
  JSON-schema structured output validated with zod, a cached system prompt, and the server-side
  refusal fallback (`fallbacks: "default"`) so a classifier decline does not fail the job.
- Ask AI caches the meeting's transcript as a prompt prefix, so follow-up questions are cheap.

## Choosing: run an evaluation first

Accuracy on Indian administrative meetings depends on room acoustics, names and code-mixing, and
published benchmarks do not cover it. Before choosing:

1. Collect 5–10 real recordings (with permission) covering a district review, a departmental review,
   and an online meeting.
2. Hand-correct 10 minutes of each.
3. Process the same audio with `STT_PROVIDER=sarvam` and `=google` and compare word error rate,
   especially on names, numbers and designations.
4. Keep the better one as the default; the adapter lets you switch per deployment.

## Adding a provider

Implement `SttProvider.transcribe(window) → segments with times relative to the window` or
`LlmProvider.generateReport / ask`, register it in the provider `index.ts`, add its key to
`config.ts`, and keep the key in Secret Manager.
