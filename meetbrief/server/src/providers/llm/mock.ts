import { TEMPLATES, formatDuration, type Utterance } from "@meetbrief/shared";
import type { AskInput, LlmProvider, ReportDraft, ReportInput } from "./types.js";

/** Deterministic, rule-based report for development and tests (no API key needed). */
export class MockLlmProvider implements LlmProvider {
  readonly name = "mock";
  readonly model = "mock-llm-1";

  async generateReport({ meeting, utterances }: ReportInput): Promise<ReportDraft> {
    const template = TEMPLATES[meeting.templateId];
    const actionLike = utterances.filter((u) => /\b(will|must|shall|decided|directed)\b/i.test(u.text));
    const decisions = utterances.filter((u) => /\b(decided|directed|resolved)\b/i.test(u.text));
    const unique = (list: Utterance[]) => [...new Map(list.map((u) => [u.text, u])).values()];
    return {
      title: meeting.title,
      executiveSummary: `(Demo summary — configure an LLM provider for real minutes.) The meeting covered ${meeting.agenda.length || "several"} agenda items over ${formatDuration(utterances.at(-1)?.endMs ?? 0)}.`,
      teluguSummary: meeting.reportLanguage === "bilingual" ? "(డెమో సారాంశం) సమావేశంలో ముఖ్యమైన అంశాలు చర్చించబడ్డాయి." : "",
      keyPoints: unique(utterances).slice(0, 5).map((u) => u.text),
      minutes: template.minutesSections.map((heading, i) => ({
        heading,
        points: i === 0 && meeting.agenda.length ? meeting.agenda : unique(utterances).slice(i, i + 2).map((u) => u.text),
      })),
      decisions: unique(decisions).map((u) => ({ text: u.text, owner: "", sourceTime: formatDuration(u.startMs) })),
      actionItems: unique(actionLike).slice(0, 10).map((u) => ({
        title: u.text,
        assignee: (u.text.match(/\b(DMHO|DIO|pharmacist|ANM|Collector)\b/i)?.[0] ?? "").toUpperCase(),
        assigneeDesignation: "",
        dueDate: "",
        dueText: u.text.match(/(within [a-z ]+|by next \w+|before the \w+|on \w+day)/i)?.[0] ?? "",
        priority: "medium" as const,
        sourceQuote: u.text,
        sourceTime: formatDuration(u.startMs),
      })),
      openQuestions: [],
      nextMeeting: "",
      reviewNotes: ["This report was produced by the demo provider. Configure LLM_PROVIDER=anthropic for real minutes."],
    };
  }

  async ask({ question, utterances }: AskInput): Promise<string> {
    const words = question.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const hit = utterances.find((u) => words.some((w) => u.text.toLowerCase().includes(w)));
    return hit
      ? `(Demo answer) The closest match is at [${formatDuration(hit.startMs)}]: "${hit.text}"`
      : "(Demo answer) I could not find that in the transcript.";
  }
}
