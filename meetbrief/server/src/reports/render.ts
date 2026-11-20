import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { TEMPLATES, formatDuration, type Meeting, type MeetingReport, type Utterance } from "@meetbrief/shared";
import { speakerName } from "./prompts.js";

/** Fonts that render Telugu correctly in Word and LibreOffice. */
const FONT = "Nirmala UI";

function para(text: string, opts: { bold?: boolean; size?: number; heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; bullet?: boolean; center?: boolean } = {}) {
  return new Paragraph({
    heading: opts.heading,
    bullet: opts.bullet ? { level: 0 } : undefined,
    alignment: opts.center ? AlignmentType.CENTER : undefined,
    spacing: { after: 120 },
    children: [new TextRun({ text, bold: opts.bold, size: opts.size, font: FONT })],
  });
}

function cell(text: string, bold = false, widthPct?: number) {
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold, font: FONT, size: 20 })] })],
  });
}

function table(header: string[], rows: string[][], widths?: number[]) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, true, widths?.[i])) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, false, widths?.[i])) })),
    ],
  });
}

export async function renderMinutesDocx(meeting: Meeting, report: MeetingReport): Promise<Buffer> {
  const template = TEMPLATES[meeting.templateId];
  const children: Array<Paragraph | Table> = [];
  if (meeting.department) children.push(para(meeting.department, { bold: true, center: true, size: 26 }));
  children.push(para(report.title || meeting.title, { heading: HeadingLevel.TITLE, center: true }));
  children.push(
    para(
      [`Date: ${meeting.date}`, `Time: ${meeting.startTime} (${meeting.timezone})`, meeting.venue && `Venue: ${meeting.venue}`, meeting.platform && `Platform: ${meeting.platform}`]
        .filter(Boolean)
        .join("   |   "),
      { center: true },
    ),
  );
  if (meeting.chairperson) children.push(para(`Chairperson: ${meeting.chairperson}`, { center: true, bold: true }));

  if (template.showsAttendance && meeting.participants.length) {
    children.push(para("Attendance", { heading: HeadingLevel.HEADING_1 }));
    children.push(
      table(
        ["#", "Name", "Designation", "Status"],
        meeting.participants.map((p, i) => [String(i + 1), p.name, [p.designation, p.organisation].filter(Boolean).join(", "), p.attendance ?? "present"]),
        [6, 40, 40, 14],
      ),
    );
  }

  children.push(para("Summary", { heading: HeadingLevel.HEADING_1 }));
  children.push(para(report.executiveSummary));
  if (report.teluguSummary) {
    children.push(para("సారాంశం", { heading: HeadingLevel.HEADING_2 }));
    children.push(para(report.teluguSummary));
  }

  if (meeting.agenda.length) {
    children.push(para("Agenda", { heading: HeadingLevel.HEADING_1 }));
    meeting.agenda.forEach((a, i) => children.push(para(`${i + 1}. ${a}`)));
  }

  for (const section of report.minutes) {
    if (!section.points.length) continue;
    children.push(para(section.heading, { heading: HeadingLevel.HEADING_1 }));
    section.points.forEach((p) => children.push(para(p, { bullet: true })));
  }

  if (report.decisions.length) {
    children.push(para("Decisions", { heading: HeadingLevel.HEADING_1 }));
    report.decisions.forEach((d, i) => children.push(para(`${i + 1}. ${d.text}${d.owner ? ` (${d.owner})` : ""}`)));
  }

  if (report.actionItems.length) {
    children.push(para("Action points", { heading: HeadingLevel.HEADING_1 }));
    children.push(
      table(
        ["#", "Action", "Responsibility", "Timeline", "Priority"],
        report.actionItems.map((a, i) => [
          String(i + 1),
          a.title,
          [a.assignee, a.assigneeDesignation].filter(Boolean).join(", ") || "—",
          a.dueDate || a.dueText || "—",
          a.priority,
        ]),
        [5, 45, 22, 16, 12],
      ),
    );
  }

  if (report.openQuestions.length) {
    children.push(para("Open questions", { heading: HeadingLevel.HEADING_1 }));
    report.openQuestions.forEach((q) => children.push(para(q, { bullet: true })));
  }
  if (report.nextMeeting) {
    children.push(para("Next meeting", { heading: HeadingLevel.HEADING_1 }));
    children.push(para(report.nextMeeting));
  }

  children.push(para(""));
  children.push(
    para(
      `Prepared with MeetBrief AI from a recording made with participants' knowledge. Generated ${report.generatedAt.slice(0, 10)}${report.editedAt ? `, last edited ${report.editedAt.slice(0, 10)}` : ""}. Verify names and figures before circulation.`,
      { size: 16 },
    ),
  );

  const doc = new Document({
    creator: "MeetBrief AI",
    title: report.title || meeting.title,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

export function renderMinutesMarkdown(meeting: Meeting, report: MeetingReport): string {
  const lines: string[] = [];
  if (meeting.department) lines.push(`**${meeting.department}**`, "");
  lines.push(`# ${report.title || meeting.title}`, "");
  lines.push(`- **Date:** ${meeting.date} ${meeting.startTime} (${meeting.timezone})`);
  if (meeting.venue) lines.push(`- **Venue:** ${meeting.venue}`);
  if (meeting.platform) lines.push(`- **Platform:** ${meeting.platform}`);
  if (meeting.chairperson) lines.push(`- **Chairperson:** ${meeting.chairperson}`);
  lines.push("");
  if (meeting.participants.length && TEMPLATES[meeting.templateId].showsAttendance) {
    lines.push("## Attendance", "", "| # | Name | Designation |", "|---|---|---|");
    meeting.participants.forEach((p, i) => lines.push(`| ${i + 1} | ${p.name} | ${[p.designation, p.organisation].filter(Boolean).join(", ")} |`));
    lines.push("");
  }
  lines.push("## Summary", "", report.executiveSummary, "");
  if (report.teluguSummary) lines.push("### సారాంశం", "", report.teluguSummary, "");
  if (report.keyPoints.length) lines.push("## Key points", "", ...report.keyPoints.map((k) => `- ${k}`), "");
  for (const s of report.minutes) {
    if (!s.points.length) continue;
    lines.push(`## ${s.heading}`, "", ...s.points.map((p) => `- ${p}`), "");
  }
  if (report.decisions.length) lines.push("## Decisions", "", ...report.decisions.map((d, i) => `${i + 1}. ${d.text}${d.owner ? ` (${d.owner})` : ""}`), "");
  if (report.actionItems.length) {
    lines.push("## Action points", "", "| # | Action | Responsibility | Timeline | Priority |", "|---|---|---|---|---|");
    report.actionItems.forEach((a, i) =>
      lines.push(`| ${i + 1} | ${a.title.replace(/\|/g, "/")} | ${[a.assignee, a.assigneeDesignation].filter(Boolean).join(", ") || "—"} | ${a.dueDate || a.dueText || "—"} | ${a.priority} |`),
    );
    lines.push("");
  }
  if (report.openQuestions.length) lines.push("## Open questions", "", ...report.openQuestions.map((q) => `- ${q}`), "");
  if (report.nextMeeting) lines.push("## Next meeting", "", report.nextMeeting, "");
  return lines.join("\n");
}

export function renderTranscriptText(meeting: Meeting, utterances: Utterance[]): string {
  const header = `${meeting.title}\n${meeting.date} ${meeting.startTime} (${meeting.timezone})\n\n`;
  return header + utterances.map((u) => `[${formatDuration(u.startMs)}] ${speakerName(meeting, u.speaker)}: ${u.text}`).join("\n") + "\n";
}
