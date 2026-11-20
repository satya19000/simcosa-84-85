import { TEMPLATES, formatDuration, type Meeting, type Utterance } from "@meetbrief/shared";

export function speakerName(meeting: Meeting, label: string): string {
  if (!label) return "Speaker";
  return meeting.speakerNames?.[label] || `Speaker ${label.replace(/^S/, "")}`;
}

export function transcriptToText(meeting: Meeting, utterances: Utterance[]): string {
  return utterances.map((u) => `[${formatDuration(u.startMs)}] ${speakerName(meeting, u.speaker)}: ${u.text}`).join("\n");
}

export function meetingContext(meeting: Meeting): string {
  const lines = [
    `Title: ${meeting.title}`,
    `Date: ${meeting.date} ${meeting.startTime} (${meeting.timezone})`,
    meeting.venue ? `Venue: ${meeting.venue}` : "",
    meeting.platform ? `Online platform: ${meeting.platform}` : "",
    meeting.department ? `Department / organisation: ${meeting.department}` : "",
    meeting.chairperson ? `Chairperson: ${meeting.chairperson}` : "",
    meeting.participants.length
      ? `Participants:\n${meeting.participants.map((p) => `- ${p.name}${p.designation ? `, ${p.designation}` : ""}${p.organisation ? ` (${p.organisation})` : ""}`).join("\n")}`
      : "",
    meeting.agenda.length ? `Agenda:\n${meeting.agenda.map((a, i) => `${i + 1}. ${a}`).join("\n")}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

const LANGUAGE_INSTRUCTIONS = {
  en: "Write the whole report in clear Indian English. Translate Telugu speech into English faithfully.",
  te: "Write the whole report in formal Telugu (Telugu script). Keep official designations, scheme names, and acronyms (e.g. PHC, ANM, HMIS) in their usual English form.",
  bilingual:
    "Write the report in clear Indian English, and also fill `teluguSummary` with a faithful formal Telugu (Telugu script) version of the executive summary.",
} as const;

/** Stable system prompt (cached). Meeting-specific content goes in the user turn. */
export const REPORT_SYSTEM_PROMPT = `You are MeetBrief, a meticulous minutes secretary for Indian professional and government meetings.
You receive meeting details and a timestamped transcript produced by speech recognition. The audio is in English, Telugu, or a mix of both (code-switching within a sentence is common).

Accuracy rules:
- Use only what is supported by the transcript. Never invent names, numbers, dates, targets, file numbers, or decisions.
- Speech recognition makes mistakes, especially with names, place names, and numbers. When something important is ambiguous, keep the most likely reading and add a short note to reviewNotes so a human can check it (include the timestamp).
- Preserve figures exactly as spoken (percentages, counts, amounts, dates).
- Distinguish decisions (agreed or directed by the chair) from suggestions and discussion.
- Every action item needs a concrete task. Use the responsible person's name and/or designation if it was stated; otherwise leave assignee empty rather than guessing.
- sourceTime and sourceQuote must be copied from the transcript line that supports the item.
- Convert relative deadlines ("by next Friday") to dueDate only when the meeting date makes the date certain; always keep the spoken form in dueText.
- Use the minutes headings you are given, in order. Leave a heading's points empty if nothing was discussed under it.
- Respect participants' privacy: do not include personal remarks unrelated to the meeting's business.`;

export function reportUserPrompt(meeting: Meeting, utterances: Utterance[]): string {
  const template = TEMPLATES[meeting.templateId];
  return `<meeting_details>
${meetingContext(meeting)}
Total duration: ${formatDuration(utterances.at(-1)?.endMs ?? 0)}
</meeting_details>

<template name="${template.name}">
Minutes headings (use in this order): ${template.minutesSections.join(" | ")}
Guidance: ${template.guidance}
</template>

<language>${LANGUAGE_INSTRUCTIONS[meeting.reportLanguage]}</language>

<transcript>
${transcriptToText(meeting, utterances)}
</transcript>

Write the meeting report as JSON matching the schema.`;
}

export const ASK_SYSTEM_PROMPT = `You answer questions about one meeting using its transcript and minutes.
- Answer only from the provided material. If the answer is not there, say so plainly.
- Cite the supporting moments with transcript timestamps in square brackets, e.g. [12:04].
- Answer in the language of the question (Telugu or English).
- Be concise.`;
