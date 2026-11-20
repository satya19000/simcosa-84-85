import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";
import { concatFlac, normaliseToFlac, probeDurationSec } from "./ffmpeg.js";

const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;
const dirP = mkdtemp(path.join(tmpdir(), "mb-ffmpeg-"));

describe.skipIf(!hasFfmpeg)("ordered reconstruction", () => {
  afterAll(async () => rm(await dirP, { recursive: true, force: true }));

  it("keeps every segment when concatenating (regression: stream copy dropped later segments)", async () => {
    const dir = await dirP;
    const parts: string[] = [];
    for (const [i, secs] of [[0, 3], [1, 2]] as const) {
      const webm = path.join(dir, `s${i}.webm`);
      spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `sine=frequency=${300 + i * 200}:duration=${secs}`, "-c:a", "libopus", webm]);
      const flac = path.join(dir, `s${i}.flac`);
      await normaliseToFlac(webm, flac);
      parts.push(flac);
    }
    const out = path.join(dir, "timeline.flac");
    await concatFlac(parts, path.join(dir, "list.txt"), out, (p, c) => writeFile(p, c));
    const d = await probeDurationSec(out);
    expect(d).toBeGreaterThan(4.8);
    expect(d).toBeLessThan(5.3);
  });
});
