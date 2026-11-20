/**
 * Data model shared by the web client and the backend.
 *
 * Firestore layout
 *   meetings/{meetingId}                         Meeting
 *   meetings/{meetingId}/segments/{index}        Segment (recording segments or an uploaded file)
 *   meetings/{meetingId}/transcriptPages/{page}  TranscriptPage (ordered, ≤ TRANSCRIPT_PAGE_SIZE utterances)
 *   meetings/{meetingId}/reports/current         MeetingReport
 *   meetings/{meetingId}/qa/{id}                 QaEntry
 *   meetings/{meetingId}/files/{id}              MeetingFile
 *   tasks/{taskId}                               ActionItem (top level so it can be listed across meetings)
 *   users/{uid}                                  UserSettings
 *   jobs/{jobId}                                 ProcessingJob (backend only)
 *
 * Storage layout (Firebase Storage bucket)
 *   meetings/{meetingId}/segments/{seg}/chunk-{n}.{ext}   original recorded chunks (never modified)
 *   meetings/{meetingId}/original/{fileName}             original uploaded file (never modified)
 *   meetings/{meetingId}/processed/...                   normalised audio, playback file, windows
 *   meetings/{meetingId}/exports/...                     generated documents
 */

export type LanguageCode = "en" | "te";
/** Language(s) expected to be spoken in the meeting. */
export type SpokenLanguage = "en" | "te" | "mixed";
/** Language of the generated report. "bilingual" = English with Telugu summary. */
export type ReportLanguage = "en" | "te" | "bilingual";

export type TemplateId =
  | "general"
  | "government_review"
  | "district_health_review"
  | "project"
  | "voice_note";

export type MeetingStatus =
  | "draft"
  | "recording"
  | "uploading"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export type ProcessingStage =
  | "waiting"
  | "preparing_audio"
  | "transcribing"
  | "merging"
  | "writing_minutes"
  | "done"
  | "failed";

export interface Participant {
  name: string;
  designation?: string;
  organisation?: string;
  /** Present / absent / special invitee, used in formal minutes. */
  attendance?: "present" | "absent" | "invitee";
}

export type ConsentContext = "in_person" | "online" | "phone" | "personal_note";

export interface ConsentRecord {
  context: ConsentContext;
  /** How participants were told (spoken announcement, chat message, written notice...). */
  method: string;
  announcedAt: string; // ISO timestamp
  confirmedByUid: string;
  /** Free text: e.g. "Chairperson approved; Dr. X asked that their remarks not be quoted." */
  notes?: string;
  objectionsRaised: boolean;
}

export interface ProcessingProgress {
  stage: ProcessingStage;
  percent: number; // 0..100
  message?: string;
  updatedAt: string;
  error?: string;
}

export interface Meeting {
  id: string;
  ownerId: string;
  memberIds: string[];
  title: string;
  /** Local meeting date in YYYY-MM-DD (in `timezone`). */
  date: string;
  /** Local start time HH:mm (in `timezone`). */
  startTime: string;
  timezone: string;
  venue?: string;
  platform?: string;
  chairperson?: string;
  participants: Participant[];
  agenda: string[];
  department?: string;
  reportLanguage: ReportLanguage;
  spokenLanguage: SpokenLanguage;
  templateId: TemplateId;
  source: "recording" | "upload" | null;
  status: MeetingStatus;
  progress?: ProcessingProgress;
  consent?: ConsentRecord;
  /** Total audio duration once known (ms). */
  durationMs?: number;
  segmentCount?: number;
  /** Speaker label → display name, e.g. { "S1": "Collector" }. */
  speakerNames?: Record<string, string>;
  /** Storage path of the reconstructed single-timeline playback file. */
  playbackPath?: string;
  openTaskCount?: number;
  summarySnippet?: string;
  createdAt: string;
  updatedAt: string;
}

export type SegmentStatus = "recording" | "uploading" | "uploaded" | "failed";

export interface Segment {
  index: number;
  kind: "chunks" | "file";
  status: SegmentStatus;
  mimeType: string;
  /** For kind=chunks: number of chunks the recorder produced (final once status=uploaded). */
  chunkCount: number;
  /** For kind=file: storage path of the original file. */
  objectPath?: string;
  originalFileName?: string;
  bytes: number;
  /** Duration measured by the client (may be approximate). */
  durationMs: number;
  startedAt: string;
  endedAt?: string;
  updatedAt: string;
}

export interface Utterance {
  id: string;
  /** Absolute offset from the start of the meeting timeline. */
  startMs: number;
  endMs: number;
  speaker: string; // provider label such as "S1", or "" when unknown
  text: string;
  lang?: LanguageCode | "mixed";
  confidence?: number;
  edited?: boolean;
}

export const TRANSCRIPT_PAGE_SIZE = 300;

export interface TranscriptPage {
  page: number;
  utterances: Utterance[];
  provider: string;
  model: string;
  createdAt: string;
}

export interface MinutesSection {
  heading: string;
  /** Paragraphs or bullet points. */
  points: string[];
}

export interface Decision {
  text: string;
  owner?: string;
  sourceStartMs?: number;
}

export interface ReportActionItem {
  title: string;
  assignee?: string;
  assigneeDesignation?: string;
  dueDate?: string; // YYYY-MM-DD when explicit, otherwise empty
  dueText?: string; // "within one week", "before next review"
  priority: "high" | "medium" | "low";
  sourceQuote?: string;
  sourceStartMs?: number;
}

export interface MeetingReport {
  language: ReportLanguage;
  templateId: TemplateId;
  title: string;
  executiveSummary: string;
  /** Short Telugu summary when language is bilingual. */
  teluguSummary?: string;
  keyPoints: string[];
  minutes: MinutesSection[];
  decisions: Decision[];
  actionItems: ReportActionItem[];
  openQuestions: string[];
  nextMeeting?: string;
  /** Things the model could not verify from audio (unclear names, numbers). */
  reviewNotes: string[];
  provider: string;
  model: string;
  generatedAt: string;
  editedAt?: string;
  editedBy?: string;
}

export type TaskStatus = "open" | "in_progress" | "done";

export interface ActionItem {
  id: string;
  meetingId: string;
  meetingTitle: string;
  ownerId: string;
  memberIds: string[];
  title: string;
  assignee?: string;
  assigneeDesignation?: string;
  dueDate?: string;
  dueText?: string;
  priority: "high" | "medium" | "low";
  status: TaskStatus;
  sourceQuote?: string;
  sourceStartMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QaEntry {
  id: string;
  question: string;
  answer: string;
  askedBy: string;
  createdAt: string;
}

export interface MeetingFile {
  id: string;
  kind: "original" | "playback" | "transcript" | "minutes";
  format: string; // webm, m4a, docx, md, txt, json
  path: string;
  label: string;
  bytes?: number;
  createdAt: string;
}

export interface UserSettings {
  timezone: string;
  reportLanguage: ReportLanguage;
  spokenLanguage: SpokenLanguage;
  defaultTemplateId: TemplateId;
  department?: string;
  /** Recording segment length in minutes (default 60). */
  segmentMinutes: number;
  /** Local chunk length in seconds; shorter chunks lose less on a crash. */
  chunkSeconds: number;
  silenceDetection: {
    enabled: boolean;
    thresholdDb: number;
    silenceMinutes: number;
    countdownSeconds: number;
  };
  keepScreenAwake: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  timezone: "Asia/Kolkata",
  reportLanguage: "en",
  spokenLanguage: "mixed",
  defaultTemplateId: "general",
  segmentMinutes: 60,
  chunkSeconds: 10,
  silenceDetection: {
    enabled: true,
    thresholdDb: -50,
    silenceMinutes: 5,
    countdownSeconds: 60,
  },
  keepScreenAwake: true,
};

export type JobStep = "prepare" | "transcribe_window" | "merge" | "report";

export interface QueueMessage {
  jobId: string;
  step: JobStep;
  /** Window index for transcribe_window. */
  window?: number;
}
