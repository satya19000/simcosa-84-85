import type { SpokenLanguage } from "@meetbrief/shared";

export interface SttInput {
  /** Local 16 kHz mono FLAC of one window. */
  localPath: string;
  /** gs:// URI of the same file (for providers that read from Cloud Storage). */
  gcsUri: string;
  durationSec: number;
  spokenLanguage: SpokenLanguage;
  /** Names, designations and terms that are likely to be spoken (speech adaptation / prompting). */
  vocabularyHints: string[];
}

export interface SttSegment {
  /** Seconds relative to the start of the window. */
  startSec: number;
  endSec: number;
  text: string;
  speaker?: string;
  lang?: "en" | "te" | "mixed";
  confidence?: number;
}

export interface SttProvider {
  readonly name: string;
  readonly model: string;
  transcribe(input: SttInput): Promise<SttSegment[]>;
}

/** Errors that should not be retried (bad credentials, unsupported audio...). */
export class PermanentProviderError extends Error {}
