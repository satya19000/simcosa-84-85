import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { config } from "../../config.js";
import { cutFlac, detectSilences } from "../../audio/ffmpeg.js";
import { planWindows } from "../../audio/cuts.js";
import { PermanentProviderError, type SttInput, type SttProvider, type SttSegment } from "./types.js";

/**
 * Sarvam AI speech-to-text (Indian languages, Telugu–English code-mixing).
 *
 * VERIFY BEFORE PRODUCTION: the request shape below follows Sarvam's public REST API
 * (POST /speech-to-text, header `api-subscription-key`, multipart `file`, `model`, `language_code`;
 * response `transcript`). The synchronous endpoint accepts short clips only (≈30 s), so each window
 * is cut into ≤ 29 s pieces at pauses. Sarvam also offers a batch API with diarization for long
 * audio; switching to it would give speaker labels. See docs/PROVIDERS.md.
 */
export class SarvamSttProvider implements SttProvider {
  readonly name = "sarvam";
  readonly model = config.SARVAM_MODEL;

  constructor() {
    if (!config.SARVAM_API_KEY) throw new PermanentProviderError("SARVAM_API_KEY is not configured");
  }

  async transcribe(input: SttInput): Promise<SttSegment[]> {
    const silences = await detectSilences(input.localPath, -35, 0.3);
    const pieces = planWindows(input.durationSec, silences, 25, 4);
    const out: SttSegment[] = [];
    const concurrency = 4;
    const results: Array<SttSegment | undefined> = new Array(pieces.length);
    let next = 0;
    const worker = async () => {
      while (next < pieces.length) {
        const p = pieces[next++];
        const piecePath = path.join(path.dirname(input.localPath), `${path.basename(input.localPath, ".flac")}-p${p.index}.flac`);
        await cutFlac(input.localPath, p.startSec, p.endSec, piecePath);
        try {
          const text = await this.callWithRetry(piecePath, input);
          if (text.trim()) results[p.index] = { startSec: p.startSec, endSec: p.endSec, text: text.trim() };
        } finally {
          await rm(piecePath, { force: true });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, pieces.length) }, worker));
    for (const r of results) if (r) out.push(r);
    return out;
  }

  private async callWithRetry(file: string, input: SttInput): Promise<string> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await this.call(file, input);
      } catch (e) {
        if (e instanceof PermanentProviderError) throw e;
        lastErr = e;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
    throw lastErr;
  }

  private async call(file: string, input: SttInput): Promise<string> {
    const form = new FormData();
    const bytes = await readFile(file);
    form.append("file", new Blob([bytes], { type: "audio/flac" }), path.basename(file));
    form.append("model", this.model);
    // "unknown" lets the model detect the language; Telugu is the anchor for mixed meetings.
    form.append("language_code", input.spokenLanguage === "en" ? "en-IN" : input.spokenLanguage === "te" ? "te-IN" : "unknown");
    const res = await fetch(`${config.SARVAM_BASE_URL}/speech-to-text`, {
      method: "POST",
      headers: { "api-subscription-key": config.SARVAM_API_KEY! },
      body: form,
    });
    if (res.status === 401 || res.status === 403 || res.status === 400 || res.status === 422) {
      throw new PermanentProviderError(`Sarvam STT rejected the request (${res.status}): ${(await res.text()).slice(0, 500)}`);
    }
    if (!res.ok) throw new Error(`Sarvam STT error ${res.status}`);
    const json = (await res.json()) as { transcript?: string };
    return json.transcript ?? "";
  }
}
