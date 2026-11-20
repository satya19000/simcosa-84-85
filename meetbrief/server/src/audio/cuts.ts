import type { SilenceSpan } from "./ffmpeg.js";

export interface Window {
  index: number;
  startSec: number;
  endSec: number;
}

/**
 * Plan windows of roughly `targetSec` across `durationSec`, moving each cut to the middle of the
 * nearest silence within ±`toleranceSec` of the ideal boundary so words are not split.
 * Falls back to a hard cut when no silence is near. Windows are contiguous and cover the input.
 */
export function planWindows(
  durationSec: number,
  silences: SilenceSpan[],
  targetSec: number,
  toleranceSec = Math.min(20, targetSec * 0.2),
): Window[] {
  if (durationSec <= 0) return [];
  if (durationSec <= targetSec + toleranceSec) return [{ index: 0, startSec: 0, endSec: durationSec }];

  const windows: Window[] = [];
  let start = 0;
  while (durationSec - start > targetSec + toleranceSec) {
    const ideal = start + targetSec;
    let cut = ideal;
    let bestDistance = Infinity;
    for (const s of silences) {
      const mid = (s.start + s.end) / 2;
      const distance = Math.abs(mid - ideal);
      if (distance <= toleranceSec && distance < bestDistance && mid > start + 1) {
        bestDistance = distance;
        cut = mid;
      }
    }
    windows.push({ index: windows.length, startSec: start, endSec: cut });
    start = cut;
  }
  windows.push({ index: windows.length, startSec: start, endSec: durationSec });
  return windows;
}
