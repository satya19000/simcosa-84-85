import { z } from "zod";
import type { Meeting, Utterance } from "@meetbrief/shared";

/** What the LLM must return. Timestamps are "H:MM:SS" or "M:SS" strings copied from the transcript. */
export const reportDraftSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  teluguSummary: z.string().describe("Telugu summary; empty string unless the report language is bilingual"),
  keyPoints: z.array(z.string()),
  minutes: z.array(z.object({ heading: z.string(), points: z.array(z.string()) })),
  decisions: z.array(z.object({ text: z.string(), owner: z.string(), sourceTime: z.string() })),
  actionItems: z.array(
    z.object({
      title: z.string(),
      assignee: z.string(),
      assigneeDesignation: z.string(),
      dueDate: z.string().describe("YYYY-MM-DD only if an explicit date can be derived, else empty"),
      dueText: z.string().describe("Deadline as spoken, e.g. 'within one week'; empty if none"),
      priority: z.enum(["high", "medium", "low"]),
      sourceQuote: z.string(),
      sourceTime: z.string(),
    }),
  ),
  openQuestions: z.array(z.string()),
  nextMeeting: z.string(),
  reviewNotes: z.array(z.string()),
});

export type ReportDraft = z.infer<typeof reportDraftSchema>;

export interface ReportInput {
  meeting: Meeting;
  utterances: Utterance[];
}

export interface AskInput {
  meeting: Meeting;
  utterances: Utterance[];
  minutesText: string;
  question: string;
}

export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  generateReport(input: ReportInput): Promise<ReportDraft>;
  ask(input: AskInput): Promise<string>;
}

export function parseTimestamp(t: string | undefined): number | undefined {
  if (!t) return undefined;
  const m = t.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if (!m) return undefined;
  return ((Number(m[1] ?? 0) * 60 + Number(m[2])) * 60 + Number(m[3])) * 1000;
}
