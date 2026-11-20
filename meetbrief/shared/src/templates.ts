import type { TemplateId } from "./types.js";

export interface MeetingTemplate {
  id: TemplateId;
  name: string;
  nameTe: string;
  description: string;
  /** Agenda items pre-filled on the setup form (editable). */
  defaultAgenda: string[];
  /** Minutes headings the report generator must use, in order. */
  minutesSections: string[];
  /** Extra guidance for the report writer. */
  guidance: string;
  /** Whether the participant list / attendance table is relevant. */
  showsAttendance: boolean;
}

export const TEMPLATES: Record<TemplateId, MeetingTemplate> = {
  general: {
    id: "general",
    name: "General professional meeting",
    nameTe: "సాధారణ సమావేశం",
    description: "Discussion summary, decisions and follow-ups for everyday meetings.",
    defaultAgenda: [],
    minutesSections: ["Purpose of the meeting", "Discussion", "Decisions", "Action items", "Next steps"],
    guidance:
      "Write in a neutral professional tone. Group discussion by topic rather than by speaker. Keep it concise.",
    showsAttendance: true,
  },
  government_review: {
    id: "government_review",
    name: "Government departmental review",
    nameTe: "ప్రభుత్వ శాఖ సమీక్ష",
    description: "Formal proceedings with action-taken report, instructions issued and responsibility.",
    defaultAgenda: [
      "Confirmation of minutes of the previous meeting",
      "Action taken report on previous decisions",
      "Review of scheme-wise progress",
      "Any other item with the permission of the Chair",
    ],
    minutesSections: [
      "Proceedings",
      "Action taken on previous decisions",
      "Agenda-wise review",
      "Instructions issued by the Chair",
      "Action points with responsibility and timeline",
    ],
    guidance:
      "Use the formal register of Indian government proceedings (e.g. 'The Chair directed...', 'It was resolved that...'). " +
      "Refer to officers by designation where known. Record instructions issued by the Chair precisely, " +
      "with the responsible officer and timeline. Do not invent file numbers, G.O. numbers or figures; " +
      "if a figure is unclear in the audio, add it to review notes.",
    showsAttendance: true,
  },
  district_health_review: {
    id: "district_health_review",
    name: "District health programme review",
    nameTe: "జిల్లా ఆరోగ్య కార్యక్రమాల సమీక్ష",
    description:
      "Programme-wise review (RCH, immunisation, NCD, TB, vector-borne diseases, etc.) with indicators, gaps and directions.",
    defaultAgenda: [
      "Action taken on previous review",
      "Maternal and child health (ANC, institutional deliveries, MMR/IMR reporting)",
      "Routine immunisation coverage",
      "Non-communicable diseases screening",
      "TB elimination programme",
      "Vector-borne disease control",
      "HMIS / portal data quality and reporting",
      "Infrastructure, drugs and human resources",
    ],
    minutesSections: [
      "Proceedings",
      "Action taken on previous review",
      "Programme-wise review",
      "Indicators and gaps discussed",
      "Directions issued",
      "Action points with responsibility and timeline",
    ],
    guidance:
      "This is a public-health programme review in an Indian district. Organise the review by programme. " +
      "Preserve indicator names, percentages, counts, PHC/CHC/sub-centre names and targets exactly as spoken; " +
      "never estimate or round them. Expand common abbreviations once (e.g. ANC, PHC, CHC, ANM, ASHA, HMIS, NCD, " +
      "NTEP) if helpful. Flag any number you are unsure of in review notes. Responsibility is usually assigned to " +
      "officers by designation (DMHO, DIO, Programme Officer, Medical Officer).",
    showsAttendance: true,
  },
  project: {
    id: "project",
    name: "Project meeting",
    nameTe: "ప్రాజెక్ట్ సమావేశం",
    description: "Status, risks, blockers, decisions and owners.",
    defaultAgenda: ["Status updates", "Risks and blockers", "Decisions needed", "Next milestones"],
    minutesSections: ["Status", "Risks and blockers", "Decisions", "Action items", "Next milestones"],
    guidance: "Focus on status against milestones, risks, owners and dates.",
    showsAttendance: true,
  },
  voice_note: {
    id: "voice_note",
    name: "Personal voice note",
    nameTe: "వ్యక్తిగత వాయిస్ నోట్",
    description: "Clean up a personal note into a summary and to-do list.",
    defaultAgenda: [],
    minutesSections: ["Summary", "Ideas", "To-do"],
    guidance:
      "This is a single speaker dictating a note to themselves. Do not invent participants. " +
      "Turn it into a clear summary and a to-do list.",
    showsAttendance: false,
  },
};

export const TEMPLATE_LIST: MeetingTemplate[] = Object.values(TEMPLATES);

/** Short consent announcement scripts users can read out before recording. */
export const CONSENT_SCRIPTS = {
  en:
    "Before we begin: this meeting will be recorded to prepare accurate minutes. " +
    "The recording and transcript will be used only for that purpose. " +
    "If anyone does not wish to be recorded, please say so now.",
  te:
    "ప్రారంభించే ముందు: ఖచ్చితమైన మినిట్స్ తయారు చేయడానికి ఈ సమావేశాన్ని రికార్డ్ చేస్తున్నాము. " +
    "రికార్డింగ్ మరియు ట్రాన్స్క్రిప్ట్ ఆ ప్రయోజనానికి మాత్రమే ఉపయోగించబడతాయి. " +
    "ఎవరైనా రికార్డ్ చేయకూడదనుకుంటే, దయచేసి ఇప్పుడే తెలియజేయండి.",
};
