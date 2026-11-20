import { v2 } from "@google-cloud/speech";
import { config } from "../../config.js";
import { PermanentProviderError, type SttInput, type SttProvider, type SttSegment } from "./types.js";

/**
 * Google Cloud Speech-to-Text v2 with the Chirp 3 model (BatchRecognize reads the window
 * directly from the Firebase Storage bucket, which is a Cloud Storage bucket).
 *
 * Checked against Google's docs (Nov 2026): Chirp 3 lists Telugu (te-IN) for BatchRecognize,
 * marked Preview on some pages; BatchRecognize accepts files up to 8 hours from Cloud Storage;
 * diarization is limited to a short language list that did not include Telugu. Re-check before
 * production and see docs/PROVIDERS.md.
 */
export class GoogleSttProvider implements SttProvider {
  readonly name = "google";
  readonly model = config.GOOGLE_STT_MODEL;
  private client = new v2.SpeechClient({ apiEndpoint: `${config.GOOGLE_STT_LOCATION}-speech.googleapis.com` });

  async transcribe(input: SttInput): Promise<SttSegment[]> {
    const recognizer = `projects/${config.FIREBASE_PROJECT_ID}/locations/${config.GOOGLE_STT_LOCATION}/recognizers/_`;
    const languageCodes =
      input.spokenLanguage === "en" ? ["en-IN"] : input.spokenLanguage === "te" ? ["te-IN"] : ["auto"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request: any = {
      recognizer,
      config: {
        autoDecodingConfig: {},
        model: this.model,
        languageCodes,
        features: { enableAutomaticPunctuation: true, enableWordTimeOffsets: true },
        adaptation: input.vocabularyHints.length
          ? { phraseSets: [{ inlinePhraseSet: { phrases: input.vocabularyHints.slice(0, 500).map((value) => ({ value, boost: 5 })) } }] }
          : undefined,
      },
      files: [{ uri: input.gcsUri }],
      recognitionOutputConfig: { inlineResponseConfig: {} },
    };
    let operation;
    try {
      [operation] = await this.client.batchRecognize(request);
    } catch (e: unknown) {
      const code = (e as { code?: number }).code;
      if (code === 3 || code === 7 || code === 16) throw new PermanentProviderError(`Google STT rejected the request: ${String(e)}`);
      throw e;
    }
    const [response] = await operation.promise();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileResult: any = response.results?.[input.gcsUri];
    if (fileResult?.error?.message) throw new Error(`Google STT: ${fileResult.error.message}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = fileResult?.transcript?.results ?? [];
    const out: SttSegment[] = [];
    let prevEnd = 0;
    for (const r of results) {
      const alt = r.alternatives?.[0];
      if (!alt?.transcript?.trim()) continue;
      const end = durationToSec(r.resultEndOffset) || prevEnd;
      const firstWord = alt.words?.[0];
      const start = firstWord ? durationToSec(firstWord.startOffset) : prevEnd;
      const lang = String(r.languageCode ?? "").toLowerCase();
      out.push({
        startSec: start,
        endSec: Math.max(end, start),
        text: alt.transcript.trim(),
        confidence: alt.confidence ?? undefined,
        lang: lang.startsWith("te") ? "te" : lang.startsWith("en") ? "en" : undefined,
      });
      prevEnd = end;
    }
    return out;
  }
}

function durationToSec(d: { seconds?: number | string | null; nanos?: number | null } | null | undefined): number {
  if (!d) return 0;
  return Number(d.seconds ?? 0) + (d.nanos ?? 0) / 1e9;
}
