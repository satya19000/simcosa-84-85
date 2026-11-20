import { describe, expect, it } from "vitest";
import {
  chunkObjectPath,
  formatDuration,
  meetingSetupSchema,
  validateDuration,
  validateMediaFile,
  UPLOAD_LIMITS,
} from "./validation.js";
import { TEMPLATES } from "./templates.js";

describe("validateMediaFile", () => {
  it("accepts common audio and video", () => {
    expect(validateMediaFile({ name: "a.mp3", type: "audio/mpeg", size: 10 }).ok).toBe(true);
    const v = validateMediaFile({ name: "review.mp4", type: "video/mp4", size: 10 });
    expect(v.ok).toBe(true);
    expect(v.isVideo).toBe(true);
    expect(validateMediaFile({ name: "voice.m4a", type: "audio/mp4", size: 10 }).isVideo).toBe(false);
  });
  it("rejects unknown, empty and oversized files", () => {
    expect(validateMediaFile({ name: "a.pdf", type: "application/pdf", size: 10 }).ok).toBe(false);
    expect(validateMediaFile({ name: "a.mp3", type: "audio/mpeg", size: 0 }).ok).toBe(false);
    expect(validateMediaFile({ name: "a.mp3", type: "audio/mpeg", size: UPLOAD_LIMITS.maxBytes + 1 }).error).toMatch(/limit/);
  });
});

describe("validateDuration", () => {
  it("bounds duration", () => {
    expect(validateDuration(500)).toBeDefined();
    expect(validateDuration(60_000)).toBeUndefined();
    expect(validateDuration(7 * 3600_000)).toMatch(/limit/);
    expect(validateDuration(Number.NaN)).toBeUndefined();
  });
});

describe("formatting", () => {
  it("formats durations", () => {
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(3_725_000)).toBe("1:02:05");
  });
  it("builds deterministic chunk paths so retries overwrite instead of duplicating", () => {
    expect(chunkObjectPath("m1", 2, 17, "webm")).toBe("meetings/m1/segments/002/chunk-00017.webm");
  });
});

describe("meetingSetupSchema", () => {
  it("validates a district review setup", () => {
    const r = meetingSetupSchema.safeParse({
      title: "District Health Society review",
      date: "2026-11-20",
      startTime: "10:30",
      timezone: "Asia/Kolkata",
      participants: [{ name: "Dr. K. Rao", designation: "DMHO" }],
      agenda: TEMPLATES.district_health_review.defaultAgenda,
      reportLanguage: "bilingual",
      spokenLanguage: "mixed",
      templateId: "district_health_review",
    });
    expect(r.success).toBe(true);
  });
  it("rejects a missing title", () => {
    const r = meetingSetupSchema.safeParse({ title: " ", date: "2026-11-20", startTime: "10:30", timezone: "Asia/Kolkata", participants: [], agenda: [], reportLanguage: "en", spokenLanguage: "en", templateId: "general" });
    expect(r.success).toBe(false);
  });
});
