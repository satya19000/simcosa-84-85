import { spawn } from "node:child_process";
import { config } from "../config.js";

function run(bin: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d));
    p.stderr.on("data", (d) => {
      stderr += d;
      if (stderr.length > 2_000_000) stderr = stderr.slice(-1_000_000);
    });
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${bin} exited with ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

/** Duration in seconds, measured from the decoded stream (robust for MediaRecorder WebM without duration header). */
export async function probeDurationSec(file: string): Promise<number> {
  const { stdout } = await run(config.FFPROBE_PATH, [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file,
  ]);
  const d = Number.parseFloat(stdout.trim());
  if (Number.isFinite(d) && d > 0) return d;
  // WebM from MediaRecorder often lacks a duration; decode to count it.
  const { stderr } = await run(config.FFMPEG_PATH, ["-hide_banner", "-i", file, "-f", "null", "-"]);
  const matches = [...stderr.matchAll(/time=(\d+):(\d+):(\d+\.\d+)/g)];
  const last = matches.at(-1);
  if (!last) throw new Error("Could not determine audio duration");
  return Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]);
}

export async function hasAudioStream(file: string): Promise<boolean> {
  const { stdout } = await run(config.FFPROBE_PATH, [
    "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", file,
  ]);
  return stdout.trim().length > 0;
}

/**
 * Decode any supported audio/video input to 16 kHz mono FLAC (lossless, compact, accepted by STT
 * providers). For video input this is the audio-extraction step. Gentle loudness normalisation
 * helps quiet speakers at the far end of a conference table.
 */
export async function normaliseToFlac(input: string, output: string): Promise<void> {
  await run(config.FFMPEG_PATH, [
    "-hide_banner", "-y", "-i", input, "-vn", "-ac", "1", "-ar", "16000",
    "-af", "highpass=f=80,dynaudnorm=f=250:g=15", "-c:a", "flac", output,
  ]);
}

/**
 * Concatenate several FLAC files (same format) into one, in order. Re-encodes rather than
 * stream-copying: a copied FLAC keeps the first file's STREAMINFO header, which reports only the
 * first segment's length and would silently drop later segments from the timeline.
 */
export async function concatFlac(inputs: string[], listFile: string, output: string, writeList: (p: string, c: string) => Promise<void>) {
  await writeList(listFile, inputs.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"));
  await run(config.FFMPEG_PATH, ["-hide_banner", "-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c:a", "flac", output]);
}

/** Compact playback file for the browser (AAC in M4A plays everywhere, including iOS Safari). */
export async function encodePlayback(input: string, output: string): Promise<void> {
  await run(config.FFMPEG_PATH, ["-hide_banner", "-y", "-i", input, "-ac", "1", "-c:a", "aac", "-b:a", "48k", "-movflags", "+faststart", output]);
}

export async function cutFlac(input: string, startSec: number, endSec: number, output: string): Promise<void> {
  await run(config.FFMPEG_PATH, [
    "-hide_banner", "-y", "-ss", startSec.toFixed(3), "-to", endSec.toFixed(3), "-i", input, "-c:a", "flac", output,
  ]);
}

export interface SilenceSpan {
  start: number;
  end: number;
}

/** Find silent stretches; used to cut windows at natural pauses rather than mid-word. */
export async function detectSilences(input: string, noiseDb = -35, minSilenceSec = 0.4): Promise<SilenceSpan[]> {
  const { stderr } = await run(config.FFMPEG_PATH, [
    "-hide_banner", "-i", input, "-af", `silencedetect=noise=${noiseDb}dB:d=${minSilenceSec}`, "-f", "null", "-",
  ]);
  return parseSilenceDetect(stderr);
}

export function parseSilenceDetect(stderr: string): SilenceSpan[] {
  const spans: SilenceSpan[] = [];
  let start: number | undefined;
  for (const line of stderr.split("\n")) {
    const s = line.match(/silence_start: (-?[\d.]+)/);
    if (s) start = Math.max(0, Number(s[1]));
    const e = line.match(/silence_end: ([\d.]+)/);
    if (e && start !== undefined) {
      spans.push({ start, end: Number(e[1]) });
      start = undefined;
    }
  }
  return spans;
}
