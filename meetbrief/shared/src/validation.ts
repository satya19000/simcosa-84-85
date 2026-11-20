import { z } from "zod";

export const participantSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  designation: z.string().trim().max(160).optional(),
  organisation: z.string().trim().max(160).optional(),
  attendance: z.enum(["present", "absent", "invitee"]).optional(),
});

export const meetingSetupSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
  timezone: z.string().min(1).max(64),
  venue: z.string().trim().max(200).optional(),
  platform: z.string().trim().max(120).optional(),
  chairperson: z.string().trim().max(160).optional(),
  participants: z.array(participantSchema).max(300),
  agenda: z.array(z.string().trim().min(1).max(500)).max(100),
  department: z.string().trim().max(200).optional(),
  reportLanguage: z.enum(["en", "te", "bilingual"]),
  spokenLanguage: z.enum(["en", "te", "mixed"]),
  templateId: z.enum(["general", "government_review", "district_health_review", "project", "voice_note"]),
});

export type MeetingSetupInput = z.infer<typeof meetingSetupSchema>;

/** Upload limits. The backend enforces the same values. */
export const UPLOAD_LIMITS = {
  maxBytes: 2 * 1024 * 1024 * 1024, // 2 GiB
  maxDurationMs: 6 * 60 * 60 * 1000, // 6 hours
  minDurationMs: 1000,
};

export const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "audio/amr",
  "audio/3gpp",
];

export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/3gpp"];

export const ACCEPTED_EXTENSIONS = [
  "mp3", "m4a", "mp4", "aac", "wav", "webm", "ogg", "oga", "opus", "flac", "amr", "3gp", "mov", "mkv",
];

export interface FileValidationResult {
  ok: boolean;
  isVideo: boolean;
  error?: string;
}

export function validateMediaFile(file: { name: string; type: string; size: number }): FileValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type) || ["mov", "mkv"].includes(ext) || (ext === "mp4" && !file.type.startsWith("audio/"));
  const typeOk =
    ACCEPTED_AUDIO_TYPES.includes(file.type) || ACCEPTED_VIDEO_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
  if (!typeOk) {
    return {
      ok: false,
      isVideo,
      error: `Unsupported format "${ext || file.type}". Use MP3, M4A, WAV, WebM, OGG, FLAC, AMR, or an MP4/MOV/MKV video.`,
    };
  }
  if (file.size <= 0) return { ok: false, isVideo, error: "The file is empty." };
  if (file.size > UPLOAD_LIMITS.maxBytes) {
    return { ok: false, isVideo, error: `File is ${formatBytes(file.size)}; the limit is ${formatBytes(UPLOAD_LIMITS.maxBytes)}.` };
  }
  return { ok: true, isVideo };
}

export function validateDuration(durationMs: number): string | undefined {
  if (!Number.isFinite(durationMs)) return undefined; // unknown: backend will measure
  if (durationMs < UPLOAD_LIMITS.minDurationMs) return "The recording is shorter than one second.";
  if (durationMs > UPLOAD_LIMITS.maxDurationMs) {
    return `The recording is ${formatDuration(durationMs)}; the limit is ${formatDuration(UPLOAD_LIMITS.maxDurationMs)}. Split it into parts.`;
  }
  return undefined;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

/** 3725000 → "1:02:05"; 65000 → "1:05" */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function segmentId(index: number): string {
  return String(index).padStart(3, "0");
}

export function chunkObjectPath(meetingId: string, segmentIndex: number, chunkIndex: number, ext: string): string {
  return `meetings/${meetingId}/segments/${segmentId(segmentIndex)}/chunk-${String(chunkIndex).padStart(5, "0")}.${ext}`;
}

export function extensionForMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4") || mime.includes("aac")) return "m4a";
  if (mime.includes("wav")) return "wav";
  return "bin";
}
