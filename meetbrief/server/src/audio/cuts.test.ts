import { describe, expect, it } from "vitest";
import { planWindows } from "./cuts.js";
import { parseSilenceDetect } from "./ffmpeg.js";

describe("planWindows", () => {
  it("returns one window for short audio", () => {
    expect(planWindows(100, [], 600)).toEqual([{ index: 0, startSec: 0, endSec: 100 }]);
  });

  it("covers the whole input contiguously", () => {
    const w = planWindows(3600, [], 600);
    expect(w[0].startSec).toBe(0);
    expect(w.at(-1)!.endSec).toBe(3600);
    for (let i = 1; i < w.length; i++) expect(w[i].startSec).toBe(w[i - 1].endSec);
    expect(w.length).toBe(6);
  });

  it("snaps cuts to nearby silences", () => {
    const w = planWindows(1500, [{ start: 590, end: 594 }, { start: 1205, end: 1207 }], 600);
    expect(w[0].endSec).toBe(592);
    expect(w[1].endSec).toBe(1206);
  });

  it("ignores silences outside tolerance", () => {
    const w = planWindows(1500, [{ start: 400, end: 401 }], 600, 20);
    expect(w[0].endSec).toBe(600);
  });
});

describe("parseSilenceDetect", () => {
  it("parses ffmpeg output", () => {
    const out = `[silencedetect @ 0x1] silence_start: 1.5\n[silencedetect @ 0x1] silence_end: 2.75 | silence_duration: 1.25\n`;
    expect(parseSilenceDetect(out)).toEqual([{ start: 1.5, end: 2.75 }]);
  });
});
