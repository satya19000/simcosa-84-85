import type { SttInput, SttProvider, SttSegment } from "./types.js";

/**
 * Deterministic stand-in used for local development, tests and demos without provider keys.
 * Produces a plausible mixed Telugu–English review conversation timed to the audio length.
 */
const LINES: Array<{ speaker: string; text: string; lang: "en" | "te" | "mixed" }> = [
  { speaker: "S1", text: "Good morning everyone. Let us start with the action taken report from the last review.", lang: "en" },
  { speaker: "S2", text: "Sir, institutional deliveries ఈ నెలలో 92 percent కి పెరిగాయి.", lang: "mixed" },
  { speaker: "S1", text: "Good. But three PHCs are still below target. DMHO will review them by next Friday.", lang: "en" },
  { speaker: "S3", text: "Immunisation coverage లో రెండు mandals వెనుకబడి ఉన్నాయి, ANM vacancies వల్ల.", lang: "mixed" },
  { speaker: "S1", text: "It was decided that the DIO must submit a catch-up plan within one week.", lang: "en" },
  { speaker: "S2", text: "HMIS data entry pending ఉంది, we will complete it before the 25th.", lang: "mixed" },
  { speaker: "S3", text: "మందుల సరఫరా గురించి ఒక సమస్య ఉంది, the indent is pending at the district store.", lang: "mixed" },
  { speaker: "S1", text: "The pharmacist will follow up with the store and report on Monday.", lang: "en" },
];

export class MockSttProvider implements SttProvider {
  readonly name = "mock";
  readonly model = "mock-stt-1";

  async transcribe(input: SttInput): Promise<SttSegment[]> {
    const out: SttSegment[] = [];
    const step = 8;
    let i = Math.floor(input.durationSec) % LINES.length;
    for (let t = 0; t < input.durationSec - 0.5; t += step) {
      const line = LINES[i % LINES.length];
      out.push({ startSec: t, endSec: Math.min(input.durationSec, t + step - 0.5), text: line.text, speaker: line.speaker, lang: line.lang, confidence: 0.9 });
      i++;
    }
    return out;
  }
}
